import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../../generated/prisma/enums.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    referral: { create: jest.Mock };
    candidateProfile: { updateMany: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      referral: { create: jest.fn() },
      candidateProfile: { updateMany: jest.fn() },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    service = new AuthService(prisma as unknown as PrismaService, jwtService as unknown as JwtService);
  });

  describe('register', () => {
    it('rejects self-registering as ADMIN', async () => {
      await expect(
        service.register({ email: 'x@test.com', password: 'Aa1aaaaa', role: Role.ADMIN, fullName: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a duplicate email with 409 Conflict', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });
      await expect(
        service.register({ email: 'dup@test.com', password: 'Aa1aaaaa', role: Role.CANDIDATE, fullName: 'Dup' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password before storing it (never stores plaintext)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'new@test.com',
        role: Role.CANDIDATE,
        candidateProfile: { id: 'c1' },
        employer: null,
      });

      await service.register({ email: 'new@test.com', password: 'PlainText123', role: Role.CANDIDATE, fullName: 'New' });

      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.passwordHash).not.toBe('PlainText123');
      expect(createArgs.data.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('ignores a self-referral (referralCode equal to the new user id) — cannot farm own referral points', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // duplicate-email check
      prisma.user.create.mockResolvedValue({
        id: 'self-id',
        email: 'self@test.com',
        role: Role.CANDIDATE,
        candidateProfile: { id: 'c1' },
        employer: null,
      });

      await service.register({
        email: 'self@test.com',
        password: 'Aa1aaaaa',
        role: Role.CANDIDATE,
        fullName: 'Self',
        referralCode: 'self-id',
      });

      expect(prisma.referral.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects an unknown email without revealing whether the account exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'ghost@test.com', password: 'whatever' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password with the same generic message as unknown email', async () => {
      const hash = await bcrypt.hash('CorrectPass1', 12);
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'real@test.com', passwordHash: hash, role: Role.CANDIDATE });

      let unknownErr: unknown;
      let wrongErr: unknown;
      try {
        await service.login({ email: 'ghost@test.com', password: 'x' });
      } catch (e) {
        unknownErr = e;
      }
      try {
        await service.login({ email: 'real@test.com', password: 'WrongPass' });
      } catch (e) {
        wrongErr = e;
      }

      expect((unknownErr as UnauthorizedException).message).toBe((wrongErr as UnauthorizedException).message);
    });

    it('never returns passwordHash in the response on success', async () => {
      const hash = await bcrypt.hash('CorrectPass1', 12);
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'real@test.com', passwordHash: hash, role: Role.CANDIDATE });

      const result = await service.login({ email: 'real@test.com', password: 'CorrectPass1' });

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toBe('signed.jwt.token');
    });
  });
});
