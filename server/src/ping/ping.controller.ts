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
  @ApiOperation({
    summary: 'Basic liveness ping (recommended for hosting probes, does NOT touch database)',
  })
  ping() {
    return this.pingService.ping();
  }

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Deep health check including database query (caution: high-frequency probes will prevent Neon scale-to-zero)',
  })
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

