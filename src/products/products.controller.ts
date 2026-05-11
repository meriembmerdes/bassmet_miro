import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: ProductQueryDto) {
    return this.productsService.findPublic(query);
  }

  @Get(':slugOrId')
  one(@Param('slugOrId') slugOrId: string) {
    return this.productsService.findOneBySlugOrId(slugOrId);
  }
}
