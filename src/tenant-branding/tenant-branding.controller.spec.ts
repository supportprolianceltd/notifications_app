import { Test, TestingModule } from '@nestjs/testing';
import { TenantBrandingController } from './tenant-branding.controller';

describe('TenantBrandingController', () => {
  let controller: TenantBrandingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantBrandingController],
    }).compile();

    controller = module.get<TenantBrandingController>(TenantBrandingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
