import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponType } from '../common/enums/coupon-type.enum';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Coupon)
    private readonly couponsRepo: Repository<Coupon>,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('SEED_DATA', 'true') !== 'true') {
      return;
    }
    await this.resetUsersIfRequested();
    await this.seedAdmin();
    await this.seedCatalog();
    await this.seedCoupons();
  }

  private async resetUsersIfRequested() {
    if (this.config.get<string>('RESET_USERS', 'false') !== 'true') {
      return;
    }
    this.logger.warn(
      'RESET_USERS=true detected. Deleting ALL users (CASCADE) then reseeding admin.',
    );
    // Postgres: remove users and all dependent rows (addresses, carts, orders, etc.)
    await this.usersRepo.manager.query('TRUNCATE TABLE users CASCADE;');
  }

  private async seedAdmin() {
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@example.com');
    const password = this.config.get<string>('ADMIN_PASSWORD', 'Admin123!');
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) return;
    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersRepo.save(
      this.usersRepo.create({
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
      }),
    );
    this.logger.log(`Seeded admin user ${email}`);
  }

  private async seedCatalog() {
    // Ensure base categories exist (idempotent)
    const electronics =
      (await this.categoriesRepo.findOne({ where: { slug: 'electronics' } })) ??
      (await this.categoriesRepo.save(
        this.categoriesRepo.create({
          name: 'Electronics',
          slug: 'electronics',
          description: 'Devices and accessories',
        }),
      ));
    const apparel =
      (await this.categoriesRepo.findOne({ where: { slug: 'apparel' } })) ??
      (await this.categoriesRepo.save(
        this.categoriesRepo.create({
          name: 'Apparel',
          slug: 'apparel',
          description: 'Clothing',
        }),
      ));
    const artisanat =
      (await this.categoriesRepo.findOne({ where: { slug: 'artisanat' } })) ??
      (await this.categoriesRepo.save(
        this.categoriesRepo.create({
          name: 'Artisanat',
          slug: 'artisanat',
          description: 'Handmade crafts and traditional products',
        }),
      ));

    const count = await this.categoriesRepo.count();
    if (count > 0) {
      // Only seed demo products on first install (when no categories existed yet)
      // Categories above are safe to create anytime.
    }

    const productsCount = await this.productsRepo.count();
    if (productsCount > 0) {
      await this.seedArtisanatProducts(artisanat);
      return;
    }
    await this.productsRepo.save([
      this.productsRepo.create({
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'Noise isolating, 30h battery',
        price: '129.99',
        compareAtPrice: '159.99',
        stock: 50,
        soldCount: 120,
        brand: 'SoundMax',
        sizes: [],
        colors: ['black', 'white'],
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        ],
        category: electronics,
        isActive: true,
      }),
      this.productsRepo.create({
        name: 'Classic T-Shirt',
        slug: 'classic-tshirt',
        description: 'Organic cotton',
        price: '29.99',
        stock: 200,
        soldCount: 400,
        brand: 'EcoWear',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['navy', 'white', 'gray'],
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        ],
        category: apparel,
        isActive: true,
      }),
    ]);
    this.logger.log('Seeded demo categories and products');

    await this.seedArtisanatProducts(artisanat);
  }

  private async seedArtisanatProducts(artisanat: Category) {
    const desired = 12;
    const existingCount = await this.productsRepo.count({
      where: { category: { id: artisanat.id } },
    });
    if (existingCount >= desired) return;

    const defs: Array<{
      name: string;
      slug: string;
      description: string;
      price: string;
      compareAtPrice?: string;
      stock: number;
      brand: string;
      sizes?: string[];
      colors?: string[];
      images: string[];
    }> = [
      {
        name: 'Djerba Handwoven Palm Basket',
        slug: 'djerba-handwoven-palm-basket',
        description:
          'Traditional Djerba palm basket, handwoven with a sturdy handle—perfect for the market or beach.',
        price: '24.90',
        stock: 60,
        brand: 'Djerba Craft',
        colors: ['natural', 'tan'],
        images: ['https://images.unsplash.com/photo-1520975958225-1a56461b8c31?w=800'],
      },
      {
        name: 'Tunisian Ceramic Bowl (Blue/White)',
        slug: 'tunisian-ceramic-bowl-blue-white',
        description:
          'Hand-painted ceramic bowl inspired by Tunisian motifs. Each piece is slightly unique.',
        price: '19.50',
        stock: 40,
        brand: 'Médina Studio',
        colors: ['blue', 'white'],
        images: ['https://images.unsplash.com/photo-1528756514091-dee5ecaa3278?w=800'],
      },
      {
        name: 'Djerba Olive Wood Serving Board',
        slug: 'djerba-olive-wood-serving-board',
        description:
          'Smooth olive-wood board with a warm grain—great for mezze, cheese, or dates.',
        price: '29.00',
        stock: 35,
        brand: 'Olive & Sand',
        colors: ['wood'],
        images: ['https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800'],
      },
      {
        name: 'Handmade Leather Babouche (Tan)',
        slug: 'handmade-leather-babouche-tan',
        description:
          'Classic Tunisian babouche slippers made from soft leather with comfortable stitching.',
        price: '34.90',
        stock: 45,
        brand: 'Souk Leather',
        sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44'],
        colors: ['tan'],
        images: ['https://images.unsplash.com/photo-1528701800489-20be3c6a2c43?w=800'],
      },
      {
        name: 'Djerba Scented Candle (Jasmine)',
        slug: 'djerba-scented-candle-jasmine',
        description:
          'A soft jasmine-inspired fragrance in a reusable glass jar—cozy Tunisian evenings in a candle.',
        price: '14.90',
        stock: 80,
        brand: 'Nuit de Djerba',
        images: ['https://images.unsplash.com/photo-1602524818630-85d34ed2a5f0?w=800'],
      },
      {
        name: 'Tunisian Fouta Towel (Sidi Bou Said Stripes)',
        slug: 'tunisian-fouta-towel-sidi-bou-said-stripes',
        description:
          'Lightweight cotton fouta—ideal for the beach, hammam, or picnic. Quick-dry and compact.',
        price: '22.00',
        stock: 70,
        brand: 'Fouta House',
        colors: ['blue', 'white'],
        images: ['https://images.unsplash.com/photo-1531327431457-2c1cb2a2f1bb?w=800'],
      },
      {
        name: 'Berber-Inspired Woven Cushion Cover',
        slug: 'berber-inspired-woven-cushion-cover',
        description:
          'Textured woven cushion cover with warm desert tones. Cover only (insert not included).',
        price: '27.50',
        stock: 25,
        brand: 'Atlas Loom',
        colors: ['sand', 'rust', 'cream'],
        images: ['https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800'],
      },
      {
        name: 'Djerba Spice Set (Harissa Blend + Caraway)',
        slug: 'djerba-spice-set-harissa-blend-caraway',
        description:
          'Two essential Tunisian spices for bold flavor: a harissa blend and aromatic caraway.',
        price: '12.90',
        stock: 100,
        brand: 'Miro Spices',
        images: ['https://images.unsplash.com/photo-1547496502-affa22d38842?w=800'],
      },
      {
        name: 'Handmade Ceramic Espresso Cups (Set of 2)',
        slug: 'handmade-ceramic-espresso-cups-set-2',
        description:
          'Small ceramic cups with a glossy glaze. A perfect gift for coffee lovers.',
        price: '18.00',
        stock: 30,
        brand: 'Médina Studio',
        colors: ['white', 'blue'],
        images: ['https://images.unsplash.com/photo-1520013573794-951a9bfbf0b4?w=800'],
      },
      {
        name: 'Djerba Braided Palm Coasters (Set of 6)',
        slug: 'djerba-braided-palm-coasters-set-6',
        description:
          'Natural braided palm coasters that protect your table and add an artisan touch.',
        price: '10.90',
        stock: 90,
        brand: 'Djerba Craft',
        colors: ['natural'],
        images: ['https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800'],
      },
      {
        name: 'Tunisian Traditional Tea Glasses (Set of 6)',
        slug: 'tunisian-traditional-tea-glasses-set-6',
        description:
          'Elegant small tea glasses for mint tea moments—classic shape with subtle detailing.',
        price: '21.90',
        stock: 40,
        brand: 'Café Carthage',
        images: ['https://images.unsplash.com/photo-1541976076758-347942db1970?w=800'],
      },
      {
        name: 'Djerba Handwoven Raffia Tote Bag',
        slug: 'djerba-handwoven-raffia-tote-bag',
        description:
          'Raffia tote with reinforced handles—lightweight, durable, and made for summer days.',
        price: '28.90',
        stock: 55,
        brand: 'Djerba Craft',
        colors: ['natural', 'black'],
        images: ['https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800'],
      },
    ];

    let inserted = 0;
    for (const d of defs) {
      const existing = await this.productsRepo.findOne({ where: { slug: d.slug } });
      if (existing) continue;
      await this.productsRepo.save(
        this.productsRepo.create({
          name: d.name,
          slug: d.slug,
          description: d.description,
          price: d.price,
          compareAtPrice: d.compareAtPrice ?? null,
          stock: d.stock,
          soldCount: 0,
          brand: d.brand,
          sizes: d.sizes ?? [],
          colors: d.colors ?? [],
          images: d.images,
          category: artisanat,
          isActive: true,
        }),
      );
      inserted += 1;
    }

    if (inserted > 0) {
      this.logger.log(`Seeded ${inserted} artisanat products (Tunisia/Djerba pack)`);
    }
  }

  private async seedCoupons() {
    const existing = await this.couponsRepo.findOne({ where: { code: 'SAVE10' } });
    if (existing) return;
    await this.couponsRepo.save(
      this.couponsRepo.create({
        code: 'SAVE10',
        type: CouponType.PERCENT,
        value: '10',
        minOrder: '50',
        maxDiscount: '25',
        isActive: true,
      }),
    );
    this.logger.log('Seeded demo coupon SAVE10');
  }
}
