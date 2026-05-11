import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StripeLib from 'stripe';
import { Order } from '../orders/entities/order.entity';

type StripeClient = InstanceType<typeof StripeLib>;

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: StripeClient | null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key
      ? new StripeLib(key, { apiVersion: '2026-03-25.dahlia' })
      : null;
    if (!this.stripe) {
      this.logger.warn('STRIPE_SECRET_KEY not set; payment intents run in mock mode');
    }
  }

  async createPaymentIntentForOrder(order: Order) {
    const amountCents = Math.round(Number(order.total) * 100);
    if (!this.stripe) {
      return {
        mock: true,
        clientSecret: `mock_cs_${order.id}`,
        paymentIntentId: `mock_pi_${order.id}`,
        amountCents,
      };
    }
    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: this.config.get<string>('STRIPE_CURRENCY', 'usd'),
      metadata: { orderId: order.id },
      automatic_payment_methods: { enabled: true },
    });
    return {
      mock: false,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amountCents,
    };
  }
}
