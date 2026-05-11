import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CheckoutDto {
  @IsUUID()
  addressId: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;
}
