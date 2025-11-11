import { Module } from '@nestjs/common';
import { ChatsController } from './controllers/chats/chats.controller';
import { MessagesController } from './controllers/messages/messages.controller';
import { StudentChatController } from './controllers/student-chat/student-chat.controller';
import { AmaautaFeedbackRatingController } from './controllers/amaautaFeedbackRating/amaautaFeedbackRating.controller';
import { ChatsService } from './services/chats/chats.service';
import { MessagesService } from './services/messages/messages.service';
import { StudentChatService } from './services/student-chat/student-chat.service';
import { AmaautaFeedbackRatingService } from './services/amaautaFeedbackRating/amaautaFeedbackRating.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../database/entities/chat.entity';
import { ChatMessage } from '../database/entities/chatMessage.entity';
import { User } from '../database/entities/user.entity';
import { OpenaiModule } from '../openai/openai.module';
import { ChatOptions } from '../database/entities/chatoptions.entity';
import { AmaautaFeedbackRating } from '../database/entities/amaautaFeedbackRating.entity';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
    TypeOrmModule.forFeature([Chat, ChatMessage, User, ChatOptions, AmaautaFeedbackRating]),
    OpenaiModule,
  ],
  controllers: [ChatsController, MessagesController, StudentChatController, AmaautaFeedbackRatingController],
  providers: [ChatsService, MessagesService, StudentChatService, AmaautaFeedbackRatingService],
})
export class ChatgptModule {}
