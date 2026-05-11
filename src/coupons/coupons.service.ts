import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponType } from '../common/enums/coupon-type.enum';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly repo: Repository<Coupon>,
  ) {}

  async validateForSubtotal(code: string, subtotal: number) {
    const coupon = await this.repo.findOne({
      where: { code: code.trim().toUpperCase(), isActive: true },
    });
    if (!coupon) throw new BadRequestException('Invalid coupon');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon expired');
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    const min = Number(coupon.minOrder);
    if (subtotal < min) {
      throw new BadRequestException(`Minimum order ${min} required`);
    }
    const discount = this.computeDiscount(subtotal, coupon);
    return { coupon, discount: discount.toFixed(2) };
  }

  computeDiscount(subtotal: number, coupon: Coupon): number {
    const val = Number(coupon.value);
    if (coupon.type === CouponType.PERCENT) {
      let d = (subtotal * val) / 100;
      if (coupon.maxDiscount) {
        d = Math.min(d, Number(coupon.maxDiscount));
      }
      return Math.min(d, subtotal);
    }
    return Math.min(val, subtotal);
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateCouponDto) {
    const entity = this.repo.create({
      code: dto.code.trim().toUpperCase(),
      type: dto.type,
      value: String(dto.value),
      minOrder: String(dto.minOrder ?? 0),
      maxDiscount:
        dto.maxDiscount != null ? String(dto.maxDiscount) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      usageLimit: dto.usageLimit ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCouponDto) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Coupon not found');
    if (dto.code) dto.code = dto.code.trim().toUpperCase();
    if (dto.value != null) c.value = String(dto.value);
    if (dto.minOrder != null) c.minOrder = String(dto.minOrder);
    if (dto.maxDiscount != null) c.maxDiscount = String(dto.maxDiscount);
    Object.assign(c, dto);
    return this.repo.save(c);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }
}
