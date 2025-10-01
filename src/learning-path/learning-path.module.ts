import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LearningPathController } from './controllers/learning-path.controller';
import { LearningPathService } from './services/learning-path.service';
import { LearningPath } from '../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../database/entities/learningPathSubscription.entity';
import { Course } from '../database/entities/course.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningPath, LearningPathSubscription, Course, User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [LearningPathController],
  providers: [LearningPathService],
  exports: [LearningPathService],
})
export class LearningPathModule {}
