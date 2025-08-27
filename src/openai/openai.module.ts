import { Module } from '@nestjs/common';
import { ChatCompletionService } from './services/chat-completation/chat-completation.service';
import { ImagesController } from './controllers/images/images.controller';
import { GenerateImageService } from './services/generate-image/generate-image.service';
import { GenerateExercisesService } from './services/generate-exercises/generate-exercises.service';
import { ExercisesController } from './controllers/exercises/exercises.controller';
import { ChaptersGPTService } from './services/chapters/chaptersGPT.service';
import { AudioController } from './controllers/audio/audio.controller';
import { AudioService } from './services/audio/audio.service';
import { QuestionsController } from './controllers/questions/questions.controller';
import { TemasController } from './controllers/temas/temas.controller';
import { ParametersModule } from 'src/parameters/parameters.module';

@Module({
  providers: [
    ChatCompletionService,
    GenerateImageService,
    GenerateExercisesService,
    ChaptersGPTService,
    AudioService,
  ],
  exports: [ChatCompletionService, ChaptersGPTService, GenerateImageService],
  controllers: [
    ImagesController,
    ExercisesController,
    AudioController,
    QuestionsController,
    TemasController,
  ],
  imports: [ParametersModule],
})
export class OpenaiModule {}
