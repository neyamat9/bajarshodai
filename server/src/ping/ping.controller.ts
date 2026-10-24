import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PingService } from './ping.service';

@ApiTags('Health & Monitoring')
@Controller('ping')
export class PingController {
  constructor(private readonly pingService: PingService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Basic liveness ping' })
  ping() {
    return this.pingService.ping();
  }

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check including database connection' })
  async health() {
    const dbStatus = await this.pingService.checkDb();
    if (!dbStatus.success) {
      throw new ServiceUnavailableException(dbStatus);
    }
    return {
      status: 'ok',
      ...this.pingService.ping(),
      database: dbStatus,
    };
  }
}

