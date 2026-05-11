import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { SetUserRoleDto } from './dto/set-user-role.dto';
import { SetUserBlockedDto } from './dto/set-user-blocked.dto';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

class UsersListQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get('dashboard/stats')
  stats() {
    return this.adminService.dashboard();
  }

  @Get('users')
  users(@Query() q: UsersListQuery) {
    if (q.search?.trim()) {
      return this.usersService.searchAll(q.search, q.page ?? 1, q.limit ?? 20);
    }
    return this.usersService.listAll(q.page ?? 1, q.limit ?? 20);
  }

  @Patch('users/:id/role')
  setRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserRoleDto,
  ) {
    return this.usersService.setRole(id, dto.role);
  }

  @Patch('users/:id/blocked')
  setBlocked(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserBlockedDto,
  ) {
    return this.usersService.setBlocked(id, dto.isBlocked);
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.adminDeleteUser(id);
  }

  @Get('reports/sales')
  salesReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.salesReport(from, to);
  }
}
