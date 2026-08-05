import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    job: { findUnique: jest.Mock<any> };
    application: { findUnique: jest.Mock<any>; create: jest.Mock<any>; update: jest.Mock<any> };
  };
  let notifications: { create: jest.Mock };

  beforeEach(() => {
    prisma = {
      job: { findUnique: jest.fn() },
      application: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    notifications = { create: jest.fn() };
    service = new ApplicationsService(prisma as unknown as PrismaService, notifications as unknown as NotificationsService);
  });

  describe('apply', () => {
    it('rejects applying to a job that does not exist', async () => {
      prisma.job.findUnique.mockResolvedValue(null);
      await expect(service.apply('cand-1', { jobId: 'ghost-job' } as never)).rejects.toThrow(NotFoundException);
    });

    it('rejects applying to a CLOSED job (job exists but not accepting applications)', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job-1', status: 'CLOSED' });
      await expect(service.apply('cand-1', { jobId: 'job-1' } as never)).rejects.toThrow(NotFoundException);
    });

    it('rejects a duplicate application to the same job with 409 Conflict', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job-1', status: 'OPEN' });
      prisma.application.findUnique.mockResolvedValue({ id: 'existing-app' });

      await expect(service.apply('cand-1', { jobId: 'job-1' } as never)).rejects.toThrow(ConflictException);
      expect(prisma.application.create).not.toHaveBeenCalled();
    });

    it('creates the application when the job is open and no prior application exists', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job-1', status: 'OPEN' });
      prisma.application.findUnique.mockResolvedValue(null);
      prisma.application.create.mockResolvedValue({ id: 'new-app', jobId: 'job-1', candidateId: 'cand-1' });

      const result = await service.apply('cand-1', { jobId: 'job-1', coverNote: 'Hi' } as never);

      expect(result).toEqual({ id: 'new-app', jobId: 'job-1', candidateId: 'cand-1' });
      expect(prisma.application.create).toHaveBeenCalledWith({
        data: { jobId: 'job-1', candidateId: 'cand-1', coverNote: 'Hi' },
      });
    });
  });

  describe('withdraw', () => {
    it('rejects withdrawing an application that belongs to a different candidate (IDOR guard)', async () => {
      prisma.application.findUnique.mockResolvedValue({ id: 'app-1', candidateId: 'someone-else' });
      await expect(service.withdraw('attacker-id', 'app-1')).rejects.toThrow(NotFoundException);
      expect(prisma.application.update).not.toHaveBeenCalled();
    });

    it('allows the owning candidate to withdraw their own application', async () => {
      prisma.application.findUnique.mockResolvedValue({ id: 'app-1', candidateId: 'cand-1' });
      prisma.application.update.mockResolvedValue({ id: 'app-1', status: 'WITHDRAWN' });

      const result = await service.withdraw('cand-1', 'app-1');

      expect(result.status).toBe('WITHDRAWN');
    });
  });
});
