import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly repo: Repository<Wishlist>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async list(userId: string) {
    return this.repo.find({
      where: { user: { id: userId } },
      relations: { product: { category: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.productRepo.findOne({
      where: { id: productId, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const existing = await this.repo.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (existing) return this.list(userId);
    const row = this.repo.create({
      user: { id: userId } as User,
      product,
    });
    await this.repo.save(row);
    return this.list(userId);
  }

  async remove(userId: string, productId: string) {
    await this.repo.delete({
      user: { id: userId },
      product: { id: productId },
    });
    return this.list(userId);
  }
}
