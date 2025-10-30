import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InstitutionController } from './institution.controller';
import { InstitutionService } from './institution.service';
import { Institution } from '../database/entities/institution.entity';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Institution]),
    OpenaiModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [InstitutionController],
  providers: [InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}
