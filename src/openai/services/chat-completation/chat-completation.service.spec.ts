import { Test, TestingModule } from '@nestjs/testing';
import { ChatCompletionService } from './chat-completation.service';

describe('ChatCompletationService', () => {
  let service: ChatCompletionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatCompletionService],
    }).compile();

    service = module.get<ChatCompletionService>(ChatCompletionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
