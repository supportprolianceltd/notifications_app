import { Test, TestingModule } from '@nestjs/testing';
import { TenantEmailProvidersController } from './tenant-email-providers.controller';

describe('TenantEmailProvidersController', () => {
  let controller: TenantEmailProvidersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantEmailProvidersController],
    }).compile();

    controller = module.get<TenantEmailProvidersController>(TenantEmailProvidersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
