import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from '../../../database/entities/chat.entity';
import { User } from '../../../database/entities/user.entity';
import { IsNull, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';
import { ChatOptions } from '../../../database/entities/chatoptions.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ChatOptions)
    private readonly _chatOptionsRepository: Repository<ChatOptions>,
  ) {}

  async initChat(userId: number): Promise<Chat> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      return null;
    }
    const chat = new Chat();
    chat.title = 'Nuevo chat';
    chat.user = user;
    return await this.chatRepository.save(chat);
  }

  async updateTitleChat(id: number, title: string): Promise<Chat> {
    const chat = await this.chatRepository.findOneBy({ id });
    if (!chat) {
      return null;
    }
    chat.title = title;
    return await this.chatRepository.save(chat);
  }

  async getChats(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      return null;
    }
    const data = await this.chatRepository.find({
      where: { user: { id: userId }, deletedAt: IsNull() },
      order: { updatedAt: 'DESC' },
    });

    return data.map((chat) => {
      return {
        id: chat.id,
        title: chat.title,
        createdAt: DateTime.fromISO(chat.createdAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
        updatedAt: DateTime.fromISO(chat.updatedAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      };
    });
  }

  async getOptions() {
    const options = await this._chatOptionsRepository.find({
      take: 5,
      order: { id: 'DESC' },
      skip: Math.floor(Math.random() * 5),
    });
    return options.map((option) => {
      return {
        shortDescription: option.shortDescription,
        allDescription: option.allDescription,
        icon: option.icon,
      };
    });
  }

  async updateDateChat(chatId: number) {
    const chat = await this.chatRepository.findOneBy({ id: chatId });
    if (!chat) {
      return null;
    }
    chat.updatedAt = new Date();
    return await this.chatRepository.save(chat);
  }

  async deleteChat(chatId: number) {
    const chat = await this.chatRepository.findOneBy({ id: chatId });
    if (!chat) {
      return {
        ok: false,
      };
    }
    await this.chatRepository.softDelete(chatId);
    return {
      ok: true,
    };
  }
}
