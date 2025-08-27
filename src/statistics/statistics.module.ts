import { Module } from '@nestjs/common';
import { StatisticsController } from './controllers/statistics/statistics.controller';
import { StatisticsService } from './service/statistics/statistics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { ActivityProgressUser } from '../database/entities/activityProgress.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Course } from 'src/database/entities/course.entity';
import { Assessment } from 'src/database/entities/assessment.entity';
import { Classes } from 'src/database/entities/classes.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ActivityProgressUser,
      Course,
      Assessment,
      Classes,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
