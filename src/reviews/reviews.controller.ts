import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';

@Controller('products')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':productId/reviews')
  list(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.listForProduct(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':productId/reviews')
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.upsert(user.sub, productId, dto);
  }
}
