import { Test, TestingModule } from '@nestjs/testing';
import { ConfigkeyService } from './configkey.service';

describe('ConfigkeyService', () => {
  let service: ConfigkeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigkeyService],
    }).compile();

    service = module.get<ConfigkeyService>(ConfigkeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
