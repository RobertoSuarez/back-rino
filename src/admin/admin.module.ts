import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { User } from '../database/entities/user.entity';
import { Course } from '../database/entities/course.entity';
import { LearningPath } from '../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../database/entities/learningPathSubscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Course,
      LearningPath,
      LearningPathSubscription,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminModule {}
