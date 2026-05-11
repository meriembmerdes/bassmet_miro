import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { Role } from '../common/enums/role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Address)
    private readonly addressesRepo: Repository<Address>,
  ) {}

  async createCustomer(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.usersRepo.findOne({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const user = this.usersRepo.create({
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: Role.CUSTOMER,
    });
    return this.usersRepo.save(user);
  }

  async createAdminIfMissing(email: string, passwordHash: string) {
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) return existing;
    const user = this.usersRepo.create({
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    });
    return this.usersRepo.save(user);
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  findByPasswordResetToken(tokenHash: string) {
    return this.usersRepo.findOne({ where: { resetPasswordToken: tokenHash } });
  }

  async setPasswordResetToken(userId: string, tokenHash: string, expires: Date) {
    await this.usersRepo.update(userId, {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expires,
    });
  }

  async updatePasswordAndClearReset(userId: string, passwordHash: string) {
    await this.usersRepo.update(userId, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { addresses: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...rest } =
      user;
    return rest;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.usersRepo.update(userId, dto);
    return this.getProfile(userId);
  }

  async listAddresses(userId: string) {
    return this.addressesRepo.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.isDefault) {
      await this.addressesRepo.update(
        { user: { id: userId } },
        { isDefault: false },
      );
    }
    const addr = this.addressesRepo.create({
      ...dto,
      label: dto.label ?? 'Home',
      user,
    });
    return this.addressesRepo.save(addr);
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const addr = await this.addressesRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!addr) throw new NotFoundException('Address not found');
    if (dto.isDefault) {
      await this.addressesRepo.update(
        { user: { id: userId } },
        { isDefault: false },
      );
    }
    Object.assign(addr, dto);
    return this.addressesRepo.save(addr);
  }

  async removeAddress(userId: string, id: string) {
    const res = await this.addressesRepo.delete({ id, user: { id: userId } });
    if (!res.affected) throw new NotFoundException('Address not found');
    return { ok: true };
  }

  async listAll(page = 1, limit = 20) {
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.email',
        'u.firstName',
        'u.lastName',
        'u.phone',
        'u.role',
        'u.isBlocked',
        'u.createdAt',
        'u.updatedAt',
      ])
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return { data: rows, total, page, limit };
  }

  async searchAll(search: string, page = 1, limit = 20) {
    const q = search.trim().toLowerCase();
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.email',
        'u.firstName',
        'u.lastName',
        'u.phone',
        'u.role',
        'u.isBlocked',
        'u.createdAt',
        'u.updatedAt',
      ])
      .where(
        '(LOWER(u.email) LIKE :q OR LOWER(u.firstName) LIKE :q OR LOWER(u.lastName) LIKE :q)',
        { q: `%${q}%` },
      )
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return { data: rows, total, page, limit };
  }

  async setRole(userId: string, role: Role) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    return this.usersRepo.save(user);
  }

  async setBlocked(userId: string, isBlocked: boolean) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isBlocked = isBlocked;
    return this.usersRepo.save(user);
  }

  async adminDeleteUser(userId: string) {
    const res = await this.usersRepo.delete(userId);
    if (!res.affected) throw new NotFoundException('User not found');
    return { ok: true };
  }
}
