import { Test, TestingModule } from '@nestjs/testing';
import { TenantConfigController } from './tenant-config.controller';

describe('TenantConfigController', () => {
  let controller: TenantConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantConfigController],
    }).compile();

    controller = module.get<TenantConfigController>(TenantConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
