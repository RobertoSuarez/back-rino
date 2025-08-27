import { Module } from '@nestjs/common';
import { DocumentsController } from './controllers/documents/documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './services/documents/documents.service';
import { Document } from '../database/entities/document.entity';
import { ConfigkeyService } from './services/configkey/configkey.service';
import { ConfigKey } from 'src/database/entities/configkey.entity';
import { ConfigkeyController } from './controllers/configkey/configkey.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, ConfigKey]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
  ],
  controllers: [DocumentsController, ConfigkeyController],
  providers: [DocumentsService, ConfigkeyService],
  exports: [ConfigkeyService],
})
export class ParametersModule {}
