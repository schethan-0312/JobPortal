import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserIdFromProfileId(profileId: string): Promise<string> {
    const candidate = await this.prisma.candidateProfile.findFirst({
      where: { OR: [{ id: profileId }, { userId: profileId }] },
    });
    if (candidate) {
      return candidate.userId;
    }
    const employer = await this.prisma.employer.findFirst({
      where: { OR: [{ id: profileId }, { userId: profileId }] },
    });
    if (employer) {
      return employer.userId;
    }
    const user = await this.prisma.user.findUnique({ where: { id: profileId } });
    if (user) {
      return user.id;
    }
    throw new NotFoundException('Target profile not found');
  }

  async follow(userId: string, targetId: string) {
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (currentUser?.role === 'EMPLOYER') {
      throw new ForbiddenException('Companies are not allowed to follow candidates or users.');
    }

    const targetUserId = await this.getUserIdFromProfileId(targetId);
    if (userId === targetUserId) {
      throw new ConflictException('You cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });

    const existing = await this.prisma.candidateEmployerFollow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new ConflictException('Connection request already sent');
      }
      throw new ConflictException('Already connected with this user');
    }

    // Candidate to Candidate requires request approval (PENDING)
    // Candidate to Company is instant follow (ACCEPTED)
    const isCandidateToCandidate = currentUser?.role === 'CANDIDATE' && targetUser?.role === 'CANDIDATE';
    const initialStatus = isCandidateToCandidate ? 'PENDING' : 'ACCEPTED';

    const created = await this.prisma.candidateEmployerFollow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
        status: initialStatus,
      },
    });

    // Also sync to legacy employerFollow if applicable
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    const employer = await this.prisma.employer.findFirst({
      where: { OR: [{ id: targetId }, { userId: targetUserId }] },
    });
    if (candidate && employer) {
      await this.prisma.employerFollow
        .upsert({
          where: { candidateId_employerId: { candidateId: candidate.id, employerId: employer.id } },
          create: { candidateId: candidate.id, employerId: employer.id },
          update: {},
        })
        .catch(() => {});
    }

    return {
      ...created,
      isPending: initialStatus === 'PENDING',
      message: initialStatus === 'PENDING' ? 'Connection request sent' : 'Following successfully',
    };
  }

  async unfollow(userId: string, targetId: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    const targetUserId = await this.getUserIdFromProfileId(targetId).catch(() => null);

    if (targetUserId) {
      // Remove follow in both directions if disconnecting
      await this.prisma.candidateEmployerFollow.deleteMany({
        where: {
          OR: [
            { followerId: userId, followingId: targetUserId },
            { followerId: targetUserId, followingId: userId },
          ],
        },
      });
    }

    if (candidate) {
      await this.prisma.employerFollow.deleteMany({
        where: { candidateId: candidate.id, employerId: targetId },
      });
    }

    return { success: true, message: 'Disconnected successfully' };
  }

  async status(userId: string, targetId: string) {
    try {
      const targetUserId = await this.getUserIdFromProfileId(targetId);
      const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });

      const myFollow = await this.prisma.candidateEmployerFollow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      });

      const theirFollow = await this.prisma.candidateEmployerFollow.findUnique({
        where: { followerId_followingId: { followerId: targetUserId, followingId: userId } },
      });

      const isCompany = targetUser?.role === 'EMPLOYER';
      const isConnected = isCompany
        ? myFollow?.status === 'ACCEPTED'
        : myFollow?.status === 'ACCEPTED' || theirFollow?.status === 'ACCEPTED';

      return {
        following: myFollow?.status === 'ACCEPTED',
        isPending: myFollow?.status === 'PENDING',
        isIncomingPending: theirFollow?.status === 'PENDING',
        isConnected: Boolean(isConnected),
      };
    } catch {
      return { following: false, isPending: false, isIncomingPending: false, isConnected: false };
    }
  }

  async incomingRequests(userId: string) {
    const list = await this.prisma.candidateEmployerFollow.findMany({
      where: {
        followingId: userId,
        status: 'PENDING',
      },
      include: {
        follower: {
          include: {
            candidateProfile: {
              select: {
                id: true,
                fullName: true,
                profilePhotoUrl: true,
                location: true,
                headline: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list
      .map((item) => {
        if (!item.follower.candidateProfile) return null;
        return {
          id: item.id,
          candidate: item.follower.candidateProfile,
          createdAt: item.createdAt,
        };
      })
      .filter(Boolean);
  }

  async acceptRequest(userId: string, requesterId: string) {
    const requesterUserId = await this.getUserIdFromProfileId(requesterId);

    // Update the incoming request to ACCEPTED
    await this.prisma.candidateEmployerFollow.updateMany({
      where: {
        followerId: requesterUserId,
        followingId: userId,
        status: 'PENDING',
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    // Create mutual connection row so both see each other as connected/friends
    await this.prisma.candidateEmployerFollow
      .upsert({
        where: { followerId_followingId: { followerId: userId, followingId: requesterUserId } },
        create: {
          followerId: userId,
          followingId: requesterUserId,
          status: 'ACCEPTED',
        },
        update: {
          status: 'ACCEPTED',
        },
      })
      .catch(() => {});

    return { success: true, message: 'Connection request accepted' };
  }

  async rejectRequest(userId: string, requesterId: string) {
    const requesterUserId = await this.getUserIdFromProfileId(requesterId);

    await this.prisma.candidateEmployerFollow.deleteMany({
      where: {
        followerId: requesterUserId,
        followingId: userId,
        status: 'PENDING',
      },
    });

    return { success: true, message: 'Connection request rejected' };
  }

  async following(userId: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId } });

    const list = await this.prisma.candidateEmployerFollow.findMany({
      where: {
        followerId: userId,
        status: 'ACCEPTED',
      },
      include: {
        following: {
          include: {
            employer: {
              select: {
                id: true,
                companyName: true,
                logoUrl: true,
                location: true,
                userId: true,
              },
            },
            candidateProfile: {
              select: {
                id: true,
                fullName: true,
                profilePhotoUrl: true,
                location: true,
                headline: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: any[] = list
      .map((item) => {
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
      })
      .filter(Boolean);

    // Also check legacy employerFollow if candidate
    if (candidate) {
      const legacyFollows = await this.prisma.employerFollow.findMany({
        where: { candidateId: candidate.id },
        include: {
          employer: {
            select: {
              id: true,
              companyName: true,
              logoUrl: true,
              location: true,
              userId: true,
            },
          },
        },
      });
      for (const leg of legacyFollows) {
        if (!results.some((r) => r.employer?.id === leg.employer.id)) {
          results.push({ id: leg.id, employer: leg.employer });
        }
      }
    }

    return results;
  }

  async followers(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });

    const list = await this.prisma.candidateEmployerFollow.findMany({
      where: {
        followingId: userId,
        status: 'ACCEPTED',
      },
      include: {
        follower: {
          include: {
            employer: {
              select: {
                id: true,
                companyName: true,
                logoUrl: true,
                location: true,
                userId: true,
              },
            },
            candidateProfile: {
              select: {
                id: true,
                fullName: true,
                profilePhotoUrl: true,
                location: true,
                headline: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: any[] = list
      .map((item) => {
        if (item.follower.employer) {
          return {
            id: item.id,
            employer: item.follower.employer,
          };
        }
        if (item.follower.candidateProfile) {
          return {
            id: item.id,
            candidate: item.follower.candidateProfile,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Also check legacy employerFollow if employer
    if (employer) {
      const legacyFollowers = await this.prisma.employerFollow.findMany({
        where: { employerId: employer.id },
        include: {
          candidate: {
            select: {
              id: true,
              fullName: true,
              profilePhotoUrl: true,
              location: true,
              headline: true,
              userId: true,
            },
          },
        },
      });
      for (const leg of legacyFollowers) {
        if (!results.some((r) => r.candidate?.id === leg.candidate.id)) {
          results.push({ id: leg.id, candidate: leg.candidate });
        }
      }
    }

    return results;
  }

  async counts(id: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { id } });
    if (candidate) {
      const followingCount = await this.prisma.candidateEmployerFollow.count({
        where: { followerId: candidate.userId, status: 'ACCEPTED' },
      });
      const followersCount = await this.prisma.candidateEmployerFollow.count({
        where: { followingId: candidate.userId, status: 'ACCEPTED' },
      });
      return { followingCount, followersCount };
    }

    const employer = await this.prisma.employer.findUnique({ where: { id } });
    if (employer) {
      const followersCount = await this.prisma.candidateEmployerFollow.count({
        where: { followingId: employer.userId, status: 'ACCEPTED' },
      });
      return { followersCount, followingCount: 0 };
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      const followingCount = await this.prisma.candidateEmployerFollow.count({
        where: { followerId: user.id, status: 'ACCEPTED' },
      });
      const followersCount = await this.prisma.candidateEmployerFollow.count({
        where: { followingId: user.id, status: 'ACCEPTED' },
      });
      return { followingCount, followersCount };
    }

    return { followingCount: 0, followersCount: 0 };
  }
}
