import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    const cat = this.repo.create({ ...dto, slug });
    return this.repo.save(cat);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.findOne(id);
    if (dto.name && !dto.slug) {
      (dto as UpdateCategoryDto & { slug?: string }).slug = slugify(dto.name);
    }
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }
}
