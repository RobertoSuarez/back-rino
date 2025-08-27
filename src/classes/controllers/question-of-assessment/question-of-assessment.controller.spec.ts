import { Test, TestingModule } from '@nestjs/testing';
import { QuestionOfAssessmentController } from './question-of-assessment.controller';

describe('QuestionOfAssessmentController', () => {
  let controller: QuestionOfAssessmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionOfAssessmentController],
    }).compile();

    controller = module.get<QuestionOfAssessmentController>(QuestionOfAssessmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
