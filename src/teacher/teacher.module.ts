import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TeacherDashboardController } from './controllers/teacher-dashboard.controller';
import { TeacherDashboardService } from './services/teacher-dashboard.service';
import { LearningPath } from '../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../database/entities/learningPathSubscription.entity';
import { Course } from '../database/entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningPath, LearningPathSubscription, Course]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [TeacherDashboardController],
  providers: [TeacherDashboardService],
})
export class TeacherModule {}
