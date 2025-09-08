import { Test, TestingModule } from '@nestjs/testing';
import { TenantConfigService } from './tenant-config.service';

describe('TenantConfigService', () => {
  let service: TenantConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantConfigService],
    }).compile();

    service = module.get<TenantConfigService>(TenantConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
