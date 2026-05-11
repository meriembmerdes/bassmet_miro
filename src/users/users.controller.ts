import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.usersService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: JwtPayloadUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/addresses')
  listAddresses(@CurrentUser() user: JwtPayloadUser) {
    return this.usersService.listAddresses(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/addresses')
  addAddress(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateAddressDto) {
    return this.usersService.addAddress(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/addresses/:id')
  updateAddress(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/addresses/:id')
  removeAddress(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.removeAddress(user.sub, id);
  }
}
