import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';
import { Chat } from '../../../database/entities/chat.entity';
import { ChatMessage } from '../../../database/entities/chatMessage.entity';
import { ChatCompletionService } from '../../../openai/services/chat-completation/chat-completation.service';
import { Repository } from 'typeorm';
import { ChatsService } from '../chats/chats.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(ChatMessage)
    private _messageRepository: Repository<ChatMessage>,
    @InjectRepository(Chat)
    private _chatRepository: Repository<Chat>,
    private _chatCompletionsService: ChatCompletionService,
    private _chatService: ChatsService,
  ) {}

  async getMessagesByChatId(chatId: number) {
    const data = await this._messageRepository.find({
      where: {
        chat: { id: chatId },
      },
      order: { createdAt: 'ASC' },
    });

    return data.map((message) => {
      return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: DateTime.fromISO(message.createdAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      };
    });
  }

  async sendMessage(chatId: number, content: string) {
    const chat = await this._chatRepository.findOneBy({ id: chatId });
    if (!chat) {
      return null;
    }
    // Registramos el mensaje
    const message = new ChatMessage();
    message.role = 'user';
    message.content = content;
    message.chat = chat;
    await this._messageRepository.save(message);

    // Recuperamos los ultimos 5 mensajes del chat pero ordenados por fecha.

    const listMessage = await this._messageRepository.find({
      where: { chat: { id: chatId } },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    listMessage.reverse();

    const responseGPT =
      await this._chatCompletionsService.generateResponseChatCompletion(
        listMessage,
      );

    // Registramos la respuesta en la base de datos.
    const messageResponse = new ChatMessage();
    messageResponse.role = responseGPT.choices[0].message.role;
    messageResponse.content = responseGPT.choices[0].message.content;
    messageResponse.chat = chat;
    await this._messageRepository.save(messageResponse);

    this._chatService.updateDateChat(chat.id);

    return [message, messageResponse].map((message) => {
      return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: DateTime.fromISO(message.createdAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      };
    });
  }
}
