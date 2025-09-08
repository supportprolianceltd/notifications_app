import { Test, TestingModule } from '@nestjs/testing';
import { TenantBrandingService } from './tenant-branding.service';

describe('TenantBrandingService', () => {
  let service: TenantBrandingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantBrandingService],
    }).compile();

    service = module.get<TenantBrandingService>(TenantBrandingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
