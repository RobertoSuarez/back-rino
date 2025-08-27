import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { MessagesService } from '../../../chatgpt/services/messages/messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly _messageService: MessagesService) {}

  @Get()
  async getMessagesByChatId(@Query('chatId', ParseIntPipe) chatId: number) {
    return await this._messageService.getMessagesByChatId(chatId);
  }
}
