import { Test, TestingModule } from '@nestjs/testing';
import { ChaptersGPTService } from './chaptersGPT.service';

describe('ChaptersService', () => {
  let service: ChaptersGPTService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChaptersGPTService],
    }).compile();

    service = module.get<ChaptersGPTService>(ChaptersGPTService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
