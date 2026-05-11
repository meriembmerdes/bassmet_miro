import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { CheckoutDto } from './dto/checkout.dto';
import { StripeService } from '../payment/stripe.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('checkout')
  checkout(@CurrentUser() user: JwtPayloadUser, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(user.sub, dto);
  }

  @Get()
  mine(@CurrentUser() user: JwtPayloadUser) {
    return this.ordersService.listMine(user.sub);
  }

  @Get(':id/track')
  track(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.track(user.sub, id);
  }

  @Get(':id')
  one(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findOneForUser(user.sub, id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.cancel(user.sub, id);
  }

  @Post(':id/payment-intent')
  async paymentIntent(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.ordersService.getForPaymentIntent(user.sub, id);
    const intent = await this.stripeService.createPaymentIntentForOrder(order);
    if (intent.paymentIntentId) {
      await this.ordersService.setStripePaymentIntentId(
        order.id,
        intent.paymentIntentId,
      );
    }
    return intent;
  }

  @Post(':id/confirm-payment')
  confirmPayment(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.markPaidForUser(user.sub, id);
  }
}
