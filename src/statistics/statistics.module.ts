import { Module } from '@nestjs/common';
import { StatisticsController } from './controllers/statistics/statistics.controller';
import { StatisticsService } from './service/statistics/statistics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { ActivityProgressUser } from '../database/entities/activityProgress.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Course } from 'src/database/entities/course.entity';
import { Chapter } from 'src/database/entities/chapter.entity';
import { Tema } from 'src/database/entities/tema.entity';
import { Activity } from 'src/database/entities/activity.entity';
import { ChapterProgressUser } from 'src/database/entities/chapterProgressUser.entity';
import { TemaProgressUser } from 'src/database/entities/temaProgressUser.entity';
import { AdminStatisticsController } from './controllers/admin-statistics/admin-statistics.controller';
import { AdminStatisticsService } from './service/admin-statistics/admin-statistics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ActivityProgressUser,
      Course,
      Chapter,
      Tema,
      Activity,
      ChapterProgressUser,
      TemaProgressUser,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [StatisticsController, AdminStatisticsController],
  providers: [StatisticsService, AdminStatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
