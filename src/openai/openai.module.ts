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
import { GeminiService } from './services/gemini/gemini.service';
import { GeminiController } from './controllers/gemini/gemini.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    ChatCompletionService,
    GenerateImageService,
    GenerateExercisesService,
    ChaptersGPTService,
    AudioService,
    GeminiService,
  ],
  exports: [ChatCompletionService, ChaptersGPTService, GenerateImageService],
  controllers: [
    ImagesController,
    ExercisesController,
    AudioController,
    QuestionsController,
    TemasController,
    GeminiController,
  ],
  imports: [
    ParametersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
})
export class OpenaiModule {}
