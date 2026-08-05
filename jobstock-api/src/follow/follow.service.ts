import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserIdFromProfileId(profileId: string): Promise<string> {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { id: profileId } });
    if (candidate) {
      return candidate.userId;
    }
    const employer = await this.prisma.employer.findUnique({ where: { id: profileId } });
    if (employer) {
      return employer.userId;
    }
    throw new NotFoundException('Target profile not found');
  }

  async follow(userId: string, targetId: string) {
    const targetUserId = await this.getUserIdFromProfileId(targetId);
    if (userId === targetUserId) {
      throw new ConflictException('You cannot follow yourself');
    }
    const existing = await this.prisma.candidateEmployerFollow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
    });
    if (existing) {
      throw new ConflictException('Already following this user');
    }
    return this.prisma.candidateEmployerFollow.create({
      data: { followerId: userId, followingId: targetUserId },
    });
  }

  async unfollow(userId: string, targetId: string) {
    const targetUserId = await this.getUserIdFromProfileId(targetId);
    const existing = await this.prisma.candidateEmployerFollow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
    });
    if (!existing) {
      throw new NotFoundException('Not following this user');
    }
    await this.prisma.candidateEmployerFollow.delete({
      where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
    });
    return { success: true };
  }

  async status(userId: string, targetId: string) {
    try {
      const targetUserId = await this.getUserIdFromProfileId(targetId);
      const existing = await this.prisma.candidateEmployerFollow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      });
      return { following: Boolean(existing) };
    } catch {
      return { following: false };
    }
  }

  async following(userId: string) {
    const list = await this.prisma.candidateEmployerFollow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          include: {
            employer: {
              select: {
                id: true,
                companyName: true,
                logoUrl: true,
                location: true,
              },
            },
            candidateProfile: {
              select: {
                id: true,
                fullName: true,
                profilePhotoUrl: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((item) => {
      if (item.following.employer) {
        return {
          id: item.id,
          employer: item.following.employer,
        };
      }
      if (item.following.candidateProfile) {
        return {
          id: item.id,
          candidate: item.following.candidateProfile,
        };
      }
      return null;
    }).filter(Boolean);
  }

  async counts(id: string) {
    let targetUserId: string | null = null;
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { id } });
    if (candidate) {
      targetUserId = candidate.userId;
    } else {
      const employer = await this.prisma.employer.findUnique({ where: { id } });
      if (employer) {
        targetUserId = employer.userId;
      }
    }

    if (!targetUserId) {
      return { followersCount: 0, followingCount: 0 };
    }

    const [followersCount, followingCount] = await Promise.all([
      this.prisma.candidateEmployerFollow.count({ where: { followingId: targetUserId } }),
      this.prisma.candidateEmployerFollow.count({ where: { followerId: targetUserId } }),
    ]);

    return { followersCount, followingCount };
  }
}
