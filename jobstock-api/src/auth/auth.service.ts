import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { Role } from '../../generated/prisma/enums.js';
import { SystemConfigService } from '../system-config/system-config.service.js';
import { EmailService } from '../email/email.service.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly systemConfig: SystemConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be self-registered');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        emailVerifyToken,
        ...(dto.role === Role.CANDIDATE
          ? { candidateProfile: { create: { fullName: dto.fullName } } }
          : { employer: { create: { companyName: dto.fullName } } }),
      },
      include: { candidateProfile: true, employer: true },
    });

    if (dto.referralCode && dto.referralCode !== user.id) {
      const referrer = await this.prisma.user.findUnique({ where: { id: dto.referralCode } });
      if (referrer) {
        const REFERRAL_POINTS = 100;
        await this.prisma.referral.create({
          data: { referrerId: referrer.id, referredId: user.id, pointsEarned: REFERRAL_POINTS },
        });
        await this.prisma.candidateProfile.updateMany({
          where: { userId: referrer.id },
          data: { referralPoints: { increment: REFERRAL_POINTS } },
        });
      }
    }

    // TODO (email delivery): send verification email containing emailVerifyToken
    const { passwordHash: _omit, emailVerifyToken: _omitToken, ...safeUser } = user;

    return {
      user: safeUser,
      ...this.issueTokens(user.id, user.email, user.role),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { passwordHash: _omit, ...safeUser } = user;

    return {
      user: safeUser,
      ...this.issueTokens(user.id, user.email, user.role),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newPasswordHash } });

    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('the entered email is invalid');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedOtp,
        passwordResetExpires: expires,
      },
    });

    await this.emailService.sendPasswordResetOtp(user.email, otp);

    return { success: true };
  }

  async verifyOtp(email: string, otp: string) {
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        passwordResetToken: hashedOtp,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('OTP is invalid or has expired');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expires,
      },
    });

    return { token: resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { success: true };
  }

  private issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
