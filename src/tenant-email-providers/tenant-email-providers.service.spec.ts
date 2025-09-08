import { Test, TestingModule } from '@nestjs/testing';
import { TenantEmailProvidersService } from './tenant-email-providers.service';

describe('TenantEmailProvidersService', () => {
  let service: TenantEmailProvidersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantEmailProvidersService],
    }).compile();

    service = module.get<TenantEmailProvidersService>(TenantEmailProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
