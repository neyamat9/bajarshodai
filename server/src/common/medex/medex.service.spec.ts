import { Test, TestingModule } from '@nestjs/testing';
import { MedExService } from './medex.service';

describe('MedExService', () => {
  let service: MedExService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedExService],
    }).compile();

    service = module.get<MedExService>(MedExService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty array for empty search queries', async () => {
    const res = await service.search('');
    expect(res).toEqual([]);
  });

  it('should return empty array for short search queries', async () => {
    const res = await service.search('a');
    expect(res).toEqual([]);
  });
});
