import { Test, TestingModule } from '@nestjs/testing';
import { ConfigkeyController } from './configkey.controller';

describe('ConfigkeyController', () => {
  let controller: ConfigkeyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigkeyController],
    }).compile();

    controller = module.get<ConfigkeyController>(ConfigkeyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
