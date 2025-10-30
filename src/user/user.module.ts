import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './controllers/auth/auth.controller';
import { FollowersController } from './controllers/followers/followers.controller';
import { UsersController } from './controllers/users/users.controller';
import { AuthService } from './services/auth/auth.service';
import { FollowersService } from './services/followers/followers.service';
import { UsersService } from './services/users/users.service';
import { User } from '../database/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResetPassword } from '../database/entities/resetPassword.entity';
import { EmailVerification } from '../database/entities/emailVerification.entity';
import { CourseModule } from '../course/course.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { Followers } from '../database/entities/followers.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ResetPassword, EmailVerification, Followers]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
    CourseModule,
    StatisticsModule,
  ],
  controllers: [AuthController, FollowersController, UsersController],
  providers: [AuthService, FollowersService, UsersService],
  exports: [JwtModule, UsersService],
})
export class UserModule {}
