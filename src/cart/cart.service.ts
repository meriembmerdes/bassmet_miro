import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: { items: { product: { category: true } } },
    });
    if (!cart) {
      cart = this.cartRepo.create({
        user: { id: userId } as User,
        items: [],
      });
      cart = await this.cartRepo.save(cart);
      cart.items = [];
    }
    return cart;
  }

  async getMine(userId: string) {
    return this.getOrCreateCart(userId);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }
    const cart = await this.getOrCreateCart(userId);
    let item = await this.itemRepo.findOne({
      where: { cart: { id: cart.id }, product: { id: dto.productId } },
      relations: { product: true },
    });
    if (item) {
      const nextQty = item.quantity + dto.quantity;
      if (product.stock < nextQty) {
        throw new BadRequestException('Insufficient stock');
      }
      item.quantity = nextQty;
      await this.itemRepo.save(item);
    } else {
      item = this.itemRepo.create({
        cart,
        product,
        quantity: dto.quantity,
      });
      await this.itemRepo.save(item);
    }
    return this.getOrCreateCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, cart: { id: cart.id } },
      relations: { product: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (item.product.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }
    item.quantity = dto.quantity;
    await this.itemRepo.save(item);
    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const res = await this.itemRepo.delete({ id: itemId, cart: { id: cart.id } });
    if (!res.affected) throw new NotFoundException('Cart item not found');
    return this.getOrCreateCart(userId);
  }

  async clearCart(cartId: string) {
    await this.itemRepo.delete({ cart: { id: cartId } });
  }
}
