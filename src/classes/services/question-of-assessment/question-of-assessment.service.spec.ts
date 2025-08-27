import { Test, TestingModule } from '@nestjs/testing';
import { QuestionOfAssessmentService } from './question-of-assessment.service';

describe('QuestionOfAssessmentService', () => {
  let service: QuestionOfAssessmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionOfAssessmentService],
    }).compile();

    service = module.get<QuestionOfAssessmentService>(QuestionOfAssessmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
