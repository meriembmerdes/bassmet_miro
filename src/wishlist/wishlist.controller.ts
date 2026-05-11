import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@CurrentUser() user: JwtPayloadUser) {
    return this.wishlistService.list(user.sub);
  }

  @Post(':productId')
  add(
    @CurrentUser() user: JwtPayloadUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.add(user.sub, productId);
  }

  @Delete(':productId')
  remove(
    @CurrentUser() user: JwtPayloadUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.remove(user.sub, productId);
  }
}
