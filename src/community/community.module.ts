import { Module } from '@nestjs/common';
import { FriendsController } from './controllers/friends/friends.controller';
import { FriendsService } from './services/friends/friends.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Followers } from '../database/entities/followers.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([Followers]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class CommunityModule {}
