import { Module } from '@nestjs/common';
import { ChatsController } from './controllers/chats/chats.controller';
import { MessagesController } from './controllers/messages/messages.controller';
import { ChatsService } from './services/chats/chats.service';
import { MessagesService } from './services/messages/messages.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../database/entities/chat.entity';
import { ChatMessage } from '../database/entities/chatMessage.entity';
import { User } from '../database/entities/user.entity';
import { OpenaiModule } from '../openai/openai.module';
import { ChatOptions } from '../database/entities/chatoptions.entity';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
    TypeOrmModule.forFeature([Chat, ChatMessage, User, ChatOptions]),
    OpenaiModule,
  ],
  controllers: [ChatsController, MessagesController],
  providers: [ChatsService, MessagesService],
})
export class ChatgptModule {}
