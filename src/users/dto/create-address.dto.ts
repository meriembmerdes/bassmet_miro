import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  line1: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  postalCode: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
