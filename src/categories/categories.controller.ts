import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }
}
