import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiFeature } from '../../generated/prisma/enums.js';
import { IsOptional, IsString } from 'class-validator';

export class TokenFilters {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  feature?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  period?: string;
}

export function calculateLogCost(modelName: string | null, promptTokens: number | null, responseTokens: number | null) {
  const model = modelName || 'gemini-3.6-flash';
  const inputPrice = 0.075; // Per 1M tokens (USD)
  const outputPrice = 0.30; // Per 1M tokens (USD)
  const inputTokens = promptTokens || 0;
  const outputTokens = responseTokens || 0;
  const inputCostUsd = (inputTokens / 1_000_000) * inputPrice;
  const outputCostUsd = (outputTokens / 1_000_000) * outputPrice;
  
  const USD_TO_INR = 83.5;
  const inputCost = inputCostUsd * USD_TO_INR;
  const outputCost = outputCostUsd * USD_TO_INR;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

@Injectable()
export class AdminTokensService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildWhereClause(filters: TokenFilters) {
    const where: any = {};

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.createdAt.lte = new Date(filters.to);
      }
    }

    if (filters.feature) {
      where.feature = filters.feature as AiFeature;
    }

    if (filters.model) {
      where.model = filters.model;
    }

    if (filters.userEmail) {
      const users = await this.prisma.user.findMany({
        where: {
          email: {
            contains: filters.userEmail,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);
      where.userId = { in: userIds };
    }

    return where;
  }

  async getUsersDetails(userIds: (string | null)[]) {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean))) as string[];
    if (uniqueIds.length === 0) return new Map<string, { email: string; name: string }>();

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        email: true,
        candidateProfile: { select: { fullName: true } },
        employer: { select: { companyName: true } },
      },
    });

    const map = new Map<string, { email: string; name: string }>();
    for (const u of users) {
      const name = u.candidateProfile?.fullName || u.employer?.companyName || u.email.split('@')[0];
      map.set(u.id, { email: u.email, name });
    }
    return map;
  }

  async getOverview(filters: TokenFilters) {
    const where = await this.buildWhereClause(filters);

    const logs = await this.prisma.aiUsageLog.findMany({
      where,
      select: {
        promptTokens: true,
        responseTokens: true,
        totalTokens: true,
        model: true,
        userId: true,
      },
    });

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalRequests = logs.length;
    let totalCost = 0;
    const uniqueUsers = new Set<string>();

    for (const log of logs) {
      totalInputTokens += log.promptTokens ?? 0;
      totalOutputTokens += log.responseTokens ?? 0;
      totalTokens += log.totalTokens ?? 0;
      if (log.userId) {
        uniqueUsers.add(log.userId);
      }
      const cost = calculateLogCost(log.model, log.promptTokens, log.responseTokens);
      totalCost += cost.totalCost;
    }

    const avgTokensPerRequest = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;

    return {
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalRequests,
      activeUsers: uniqueUsers.size,
      avgTokensPerRequest,
      totalCost,
    };
  }

  async getUserUsage(
    filters: TokenFilters,
    search?: string,
    sortBy = 'totalTokens',
    sortOrder: 'asc' | 'desc' = 'desc',
    page = 1,
    pageSize = 25,
  ) {
    const sTerm = search || filters.search;
    const finalSortBy = sortBy || filters.sortBy || 'totalTokens';
    const finalSortOrder = (sortOrder || filters.sortOrder || 'desc') as 'asc' | 'desc';
    const finalPage = page || (filters.page ? parseInt(filters.page, 10) : 1);
    const finalPageSize = pageSize || (filters.pageSize ? parseInt(filters.pageSize, 10) : 25);

    const where = await this.buildWhereClause(filters);

    const logs = await this.prisma.aiUsageLog.findMany({
      where,
      select: {
        userId: true,
        promptTokens: true,
        responseTokens: true,
        totalTokens: true,
        model: true,
        createdAt: true,
      },
    });

    const userGroupMap = new Map<string, {
      userId: string;
      totalRequests: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      estimatedCost: number;
      lastUsageTime: Date;
    }>();

    for (const log of logs) {
      const uId = log.userId || 'guest';
      const existing = userGroupMap.get(uId) || {
        userId: uId,
        totalRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        lastUsageTime: new Date(0),
      };

      existing.totalRequests += 1;
      existing.inputTokens += log.promptTokens ?? 0;
      existing.outputTokens += log.responseTokens ?? 0;
      existing.totalTokens += log.totalTokens ?? 0;
      
      const cost = calculateLogCost(log.model, log.promptTokens, log.responseTokens);
      existing.estimatedCost += cost.totalCost;

      const logDate = new Date(log.createdAt);
      if (logDate > existing.lastUsageTime) {
        existing.lastUsageTime = logDate;
      }

      userGroupMap.set(uId, existing);
    }

    const userIds = Array.from(userGroupMap.keys()).filter((id) => id !== 'guest');
    const userDetailsMap = await this.getUsersDetails(userIds);

    let resultList = Array.from(userGroupMap.values()).map((item) => {
      const details = item.userId === 'guest'
        ? { email: 'guest@jobstock.com', name: 'Guest/Unauthenticated' }
        : userDetailsMap.get(item.userId) || { email: 'unknown@jobstock.com', name: 'Deleted User' };

      return {
        ...item,
        email: details.email,
        name: details.name,
      };
    });

    if (sTerm) {
      const s = sTerm.toLowerCase();
      resultList = resultList.filter(
        (r) => r.email.toLowerCase().includes(s) || r.name.toLowerCase().includes(s),
      );
    }

    resultList.sort((a: any, b: any) => {
      let valA = a[finalSortBy];
      let valB = b[finalSortBy];

      if (valA instanceof Date) {
        valA = valA.getTime();
        valB = valB.getTime();
      }

      if (valA < valB) return finalSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return finalSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = resultList.length;
    const items = resultList.slice((finalPage - 1) * finalPageSize, finalPage * finalPageSize);

    return {
      items,
      total,
      page: finalPage,
      pageSize: finalPageSize,
    };
  }

  async getUserDetails(userId: string) {
    const isGuest = userId === 'guest';
    let userDetails = { email: 'guest@jobstock.com', name: 'Guest/Unauthenticated' };

    if (!isGuest) {
      const detailsMap = await this.getUsersDetails([userId]);
      userDetails = detailsMap.get(userId) || { email: 'unknown@jobstock.com', name: 'Deleted User' };
    }

    const logs = await this.prisma.aiUsageLog.findMany({
      where: { userId: isGuest ? null : userId },
      orderBy: { createdAt: 'desc' },
    });

    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let estimatedCost = 0;
    const requestCount = logs.length;

    const dailyMap = new Map<string, { date: string; input: number; output: number; total: number; cost: number }>();
    const monthlyMap = new Map<string, { date: string; input: number; output: number; total: number; cost: number }>();
    const modelDistributionMap = new Map<string, number>();
    const featureDistributionMap = new Map<string, number>();

    for (const log of logs) {
      const inT = log.promptTokens ?? 0;
      const outT = log.responseTokens ?? 0;
      const totT = log.totalTokens ?? 0;
      const cost = calculateLogCost(log.model, log.promptTokens, log.responseTokens).totalCost;

      totalTokens += totT;
      inputTokens += inT;
      outputTokens += outT;
      estimatedCost += cost;

      const model = log.model || 'gemini-3.6-flash';
      modelDistributionMap.set(model, (modelDistributionMap.get(model) || 0) + totT);
      featureDistributionMap.set(log.feature, (featureDistributionMap.get(log.feature) || 0) + totT);

      const date = new Date(log.createdAt);
      const dayKey = date.toISOString().split('T')[0];
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const dayObj = dailyMap.get(dayKey) || { date: dayKey, input: 0, output: 0, total: 0, cost: 0 };
      dayObj.input += inT;
      dayObj.output += outT;
      dayObj.total += totT;
      dayObj.cost += cost;
      dailyMap.set(dayKey, dayObj);

      const monthObj = monthlyMap.get(monthKey) || { date: monthKey, input: 0, output: 0, total: 0, cost: 0 };
      monthObj.input += inT;
      monthObj.output += outT;
      monthObj.total += totT;
      monthObj.cost += cost;
      monthlyMap.set(monthKey, monthObj);
    }

    const dailyUsage = Array.from(dailyMap.values()).reverse().slice(0, 30);
    const monthlyUsage = Array.from(monthlyMap.values()).reverse();

    const modelDistribution = Array.from(modelDistributionMap.entries()).map(([name, value]) => ({ name, value }));
    const featureDistribution = Array.from(featureDistributionMap.entries()).map(([name, value]) => ({ name, value }));

    const history = logs.map((log) => {
      const cost = calculateLogCost(log.model, log.promptTokens, log.responseTokens).totalCost;
      return {
        id: log.id,
        createdAt: log.createdAt,
        feature: log.feature,
        model: log.model || 'gemini-3.6-flash',
        promptTokens: log.promptTokens ?? 0,
        responseTokens: log.responseTokens ?? 0,
        totalTokens: log.totalTokens ?? 0,
        success: log.success,
        errorMessage: log.errorMessage,
        latencyMs: log.latencyMs,
        cost,
      };
    });

    return {
      userId,
      name: userDetails.name,
      email: userDetails.email,
      totalTokens,
      inputTokens,
      outputTokens,
      requestCount,
      estimatedCost,
      dailyUsage,
      monthlyUsage,
      modelDistribution,
      featureDistribution,
      history,
    };
  }

  async getAnalytics(filters: TokenFilters, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const where = await this.buildWhereClause(filters);

    const logs = await this.prisma.aiUsageLog.findMany({
      where,
      select: {
        promptTokens: true,
        responseTokens: true,
        totalTokens: true,
        model: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const trendMap = new Map<string, { date: string; input: number; output: number; total: number; requests: number; cost: number }>();

    for (const log of logs) {
      const date = new Date(log.createdAt);
      let key = '';

      if (period === 'weekly') {
        const day = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - day);
        key = startOfWeek.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      const existing = trendMap.get(key) || { date: key, input: 0, output: 0, total: 0, requests: 0, cost: 0 };
      existing.input += log.promptTokens ?? 0;
      existing.output += log.responseTokens ?? 0;
      existing.total += log.totalTokens ?? 0;
      existing.requests += 1;

      const cost = calculateLogCost(log.model, log.promptTokens, log.responseTokens).totalCost;
      existing.cost += cost;

      trendMap.set(key, existing);
    }

    return Array.from(trendMap.values());
  }

  async getHistory(filters: TokenFilters, page = 1, pageSize = 25) {
    const where = await this.buildWhereClause(filters);

    const [logs, total] = await Promise.all([
      this.prisma.aiUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.aiUsageLog.count({ where }),
    ]);

    const userIds = logs.map((log) => log.userId).filter(Boolean);
    const userDetailsMap = await this.getUsersDetails(userIds);

    const items = logs.map((log) => {
      const details = log.userId
        ? userDetailsMap.get(log.userId) || { email: 'unknown@jobstock.com', name: 'Deleted User' }
        : { email: 'guest@jobstock.com', name: 'Guest' };

      const cost = calculateLogCost(log.model, log.promptTokens, log.responseTokens).totalCost;

      return {
        id: log.id,
        createdAt: log.createdAt,
        email: details.email,
        name: details.name,
        feature: log.feature,
        model: log.model || 'gemini-3.6-flash',
        promptTokens: log.promptTokens ?? 0,
        responseTokens: log.responseTokens ?? 0,
        totalTokens: log.totalTokens ?? 0,
        success: log.success,
        errorMessage: log.errorMessage,
        latencyMs: log.latencyMs,
        cost,
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async exportCsv(filters: TokenFilters) {
    const where = await this.buildWhereClause(filters);

    const logs = await this.prisma.aiUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const userIds = logs.map((log) => log.userId).filter(Boolean);
    const userDetailsMap = await this.getUsersDetails(userIds);

    let csvContent = 'Date/Time,User Name,Email,Feature,Model,Input Tokens,Output Tokens,Total Tokens,Latency (ms),Status,Cost (Rs)\n';

    for (const log of logs) {
      const details = log.userId
        ? userDetailsMap.get(log.userId) || { email: 'unknown@jobstock.com', name: 'Deleted User' }
        : { email: 'guest@jobstock.com', name: 'Guest' };

      const cost = calculateLogCost(log.model, log.promptTokens, log.responseTokens).totalCost;
      const statusStr = log.success ? 'SUCCESS' : 'FAILED';
      const cleanErr = log.errorMessage ? log.errorMessage.replace(/"/g, '""') : '';

      csvContent += `"${new Date(log.createdAt).toISOString()}","${details.name.replace(/"/g, '""')}","${details.email.replace(/"/g, '""')}","${log.feature}","${log.model || 'gemini-3.6-flash'}",${log.promptTokens ?? 0},${log.responseTokens ?? 0},${log.totalTokens ?? 0},${log.latencyMs},"${statusStr}",${cost.toFixed(6)}\n`;
    }

    return csvContent;
  }
}
