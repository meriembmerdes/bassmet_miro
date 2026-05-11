import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createCustomer({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('User is blocked');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user) {
      return { message: 'If the email exists, reset instructions were sent.' };
    }
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await this.usersService.setPasswordResetToken(user.id, tokenHash, expires);
    this.logger.warn(`Password reset token for ${user.email}: ${raw}`);
    return {
      message: 'If the email exists, reset instructions were sent.',
      devToken: process.env.NODE_ENV !== 'production' ? raw : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(tokenHash);
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePasswordAndClearReset(user.id, passwordHash);
    return { message: 'Password updated' };
  }

  private buildAuthResponse(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: userId, email, role },
    };
  }
}
