import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

import pg from 'pg';
import { getCapacityConfig } from '../config/capacity.config.js';
const { Pool } = pg;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const capacity = getCapacityConfig();
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: capacity.databasePool.max,
      idleTimeoutMillis: capacity.databasePool.idleTimeoutMs,
      connectionTimeoutMillis: capacity.databasePool.connectionTimeoutMs,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
