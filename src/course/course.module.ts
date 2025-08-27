import { Module } from '@nestjs/common';
import { ChaptersController } from './controllers/chapters/chapters.controller';
import { CoursesController } from './controllers/courses/courses.controller';
import { CoursesService } from './services/courses/courses.service';
import { ChaptersService } from './services/chapters/chapters.service';
import { SubscriptionsController } from './controllers/subscriptions/subscriptions.controller';
import { TemaController } from './controllers/tema/tema.controller';
import { ExercisesController } from './controllers/exercises/exercises.controller';
import { ExercisesService } from './services/exercises/exercises.service';
import { SubscriptionsService } from './services/subscriptions/subscriptions.service';
import { TemaService } from './services/tema/tema.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../database/entities/course.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { User } from '../database/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Chapter } from '../database/entities/chapter.entity';
import { ChapterProgressUser } from '../database/entities/chapterProgressUser.entity';
import { Tema } from '../database/entities/tema.entity';
import { TemaProgressUser } from '../database/entities/temaProgressUser.entity';
import { ActivityController } from './controllers/activity/activity.controller';
import { ActivityService } from './services/activity/activity.service';
import { Activity } from '../database/entities/activity.entity';
import { Exercise } from '../database/entities/exercise.entity';
import { OpenaiModule } from '../openai/openai.module';
import { ActivityProgressUser } from '../database/entities/activityProgress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Subscription,
      User,
      Chapter,
      ChapterProgressUser,
      Tema,
      TemaProgressUser,
      Activity,
      ActivityProgressUser,
      Exercise,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
    OpenaiModule,
  ],
  controllers: [
    ChaptersController,
    CoursesController,
    SubscriptionsController,
    TemaController,
    ExercisesController,
    ActivityController,
  ],
  providers: [
    CoursesService,
    ChaptersService,
    ExercisesService,
    SubscriptionsService,
    TemaService,
    ActivityService,
  ],
  exports: [CoursesService],
})
export class CourseModule {}
