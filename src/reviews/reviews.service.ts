import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly repo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async listForProduct(productId: string) {
    const rows = await this.repo.find({
      where: { product: { id: productId } },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map(({ user, ...r }) => ({
      ...r,
      user: user
        ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : null,
    }));
  }

  async upsert(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    let review = await this.repo.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (!review) {
      review = this.repo.create({
        user: { id: userId } as User,
        product,
        rating: dto.rating,
        comment: dto.comment ?? null,
      });
    } else {
      review.rating = dto.rating;
      review.comment = dto.comment ?? null;
    }
    return this.repo.save(review);
  }
}
