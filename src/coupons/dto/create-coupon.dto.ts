import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { CouponType } from '../../common/enums/coupon-type.enum';

export class CreateCouponDto {
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,40}$/i)
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
