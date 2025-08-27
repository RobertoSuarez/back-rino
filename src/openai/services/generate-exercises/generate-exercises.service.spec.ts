import { Test, TestingModule } from '@nestjs/testing';
import { GenerateExercisesService } from './generate-exercises.service';

describe('GenerateExercisesService', () => {
  let service: GenerateExercisesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateExercisesService],
    }).compile();

    service = module.get<GenerateExercisesService>(GenerateExercisesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
