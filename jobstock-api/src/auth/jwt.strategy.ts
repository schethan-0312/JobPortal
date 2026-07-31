import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    // A force-logout sets sessionRevokedAt — any token issued before that instant
    // is rejected even though its own signature/expiry are still technically valid.
    if (user.sessionRevokedAt && payload.iat * 1000 < user.sessionRevokedAt.getTime()) {
      throw new UnauthorizedException('Session has been revoked, please log in again');
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}
