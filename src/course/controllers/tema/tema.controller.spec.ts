import { Test, TestingModule } from '@nestjs/testing';
import { TemaController } from './tema.controller';

describe('TemaController', () => {
  let controller: TemaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemaController],
    }).compile();

    controller = module.get<TemaController>(TemaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
