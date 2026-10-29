import 'dotenv/config';
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    let url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set. Check your .env file.');
    }
    url = url.replace(/&channel_binding=[^&]*/, '');
    url = url.replace(/\?channel_binding=[^&]*&?/, '?');

    const pool = new Pool({
      connectionString: url,

      // Maximum connections allowed in the pool
      max: 20,
      // Scale-to-zero friendly: allow all idle connections to close when quiet
      min: 0,
      // Disconnect idle clients after 15 seconds of inactivity so Neon can suspend
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,

      // Disable aggressive TCP keep-alive probes that keep serverless endpoints awake
      keepAlive: false,

      statement_timeout: 30000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }
}
