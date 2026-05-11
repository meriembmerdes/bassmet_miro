import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';
import { AdminProductQueryDto } from './dto/admin-product-query.dto';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findPublic(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.is_active = :active', { active: true });

    if (query.search) {
      qb.andWhere(
        '(LOWER(p.name) LIKE :q OR LOWER(p.description) LIKE :q OR LOWER(p.brand) LIKE :q)',
        { q: `%${query.search.toLowerCase()}%` },
      );
    }
    if (query.categoryId) {
      qb.andWhere('p.category_id = :cid', { cid: query.categoryId });
    }
    if (query.minPrice != null) {
      qb.andWhere('p.price >= :minP', { minP: query.minPrice });
    }
    if (query.maxPrice != null) {
      qb.andWhere('p.price <= :maxP', { maxP: query.maxPrice });
    }
    if (query.brand) {
      qb.andWhere('LOWER(p.brand) = LOWER(:brand)', { brand: query.brand });
    }
    if (query.size) {
      qb.andWhere('p.sizes::text ILIKE :size', { size: `%${query.size}%` });
    }
    if (query.color) {
      qb.andWhere('p.colors::text ILIKE :color', { color: `%${query.color}%` });
    }

    if (query.minRating != null) {
      qb.andWhere(
        `(SELECT COALESCE(AVG(r.rating),0) FROM reviews r WHERE r.product_id = p.id) >= :mr`,
        { mr: query.minRating },
      );
    }

    switch (query.sort) {
      case ProductSort.PRICE_ASC:
        qb.orderBy('p.price', 'ASC');
        break;
      case ProductSort.PRICE_DESC:
        qb.orderBy('p.price', 'DESC');
        break;
      case ProductSort.BEST_SELLER:
        qb.orderBy('p.soldCount', 'DESC');
        break;
      case ProductSort.NEWEST:
      default:
        qb.orderBy('p.createdAt', 'DESC');
        break;
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const withRating = await Promise.all(
      items.map(async (p) => ({
        ...p,
        averageRating: await this.avgRating(p.id),
      })),
    );

    return { data: withRating, total, page, limit };
  }

  private async avgRating(productId: string): Promise<number> {
    const row = await this.repo.manager.query(
      `SELECT COALESCE(AVG(rating),0)::float AS avg FROM reviews WHERE product_id = $1`,
      [productId],
    );
    return Number(row[0]?.avg ?? 0);
  }

  async findOneBySlugOrId(param: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        param,
      );
    const product = await this.repo.findOne({
      where: isUuid ? { id: param } : { slug: param },
      relations: { category: true },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }
    const averageRating = await this.avgRating(product.id);
    return { ...product, averageRating };
  }

  async findOneAdmin(id: string) {
    const p = await this.repo.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async findAdmin(query: AdminProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      qb.where(
        '(LOWER(p.name) LIKE :q OR LOWER(p.description) LIKE :q OR LOWER(p.brand) LIKE :q OR LOWER(p.slug) LIKE :q)',
        { q: `%${q}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { data: items, total, page, limit };
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    const entity = this.repo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      price: String(dto.price),
      compareAtPrice:
        dto.compareAtPrice != null ? String(dto.compareAtPrice) : null,
      stock: dto.stock,
      brand: dto.brand ?? '',
      sizes: dto.sizes ?? [],
      colors: dto.colors ?? [],
      images: dto.images ?? [],
      isActive: dto.isActive ?? true,
      category: dto.categoryId
        ? ({ id: dto.categoryId } as Category)
        : null,
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateProductDto) {
    const p = await this.findOneAdmin(id);
    if (dto.name && !dto.slug) {
      dto.slug = slugify(dto.name);
    }
    if (dto.price != null) p.price = String(dto.price);
    if (dto.compareAtPrice != null) p.compareAtPrice = String(dto.compareAtPrice);
    if (dto.categoryId !== undefined) {
      p.category = dto.categoryId
        ? ({ id: dto.categoryId } as Category)
        : null;
    }
    const { categoryId: _c, ...patch } = dto;
    Object.assign(p, patch);
    return this.repo.save(p);
  }

  async remove(id: string) {
    const res = await this.repo.delete(id);
    if (!res.affected) {
      throw new NotFoundException('Product not found');
    }
    return { ok: true };
  }

  async adjustStock(id: string, delta: number) {
    const p = await this.findOneAdmin(id);
    p.stock = Math.max(0, p.stock + delta);
    return this.repo.save(p);
  }
}
