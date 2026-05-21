import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { TeacherDashboardController } from './controllers/teacher-dashboard.controller';
import { TeacherDashboardService } from './services/teacher-dashboard.service';
import { TeacherGradebookController } from './controllers/teacher-gradebook.controller';
import { TeacherGradebookService } from './services/teacher-gradebook.service';

import { LearningPath } from '../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../database/entities/learningPathSubscription.entity';
import { LearningPathGrade } from '../database/entities/learning-path-grade.entity';
import { Course } from '../database/entities/course.entity';
import { ActivityProgressUser } from '../database/entities/activityProgress.entity';
import { Activity } from '../database/entities/activity.entity';
import { Chapter } from '../database/entities/chapter.entity';
import { Tema } from '../database/entities/tema.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningPath,
      LearningPathSubscription,
      LearningPathGrade,
      Course,
      ActivityProgressUser,
      Activity,
      Chapter,
      Tema,
      User,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [TeacherDashboardController, TeacherGradebookController],
  providers: [TeacherDashboardService, TeacherGradebookService],
})
export class TeacherModule {}
