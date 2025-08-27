import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateMessageDto } from '../../../chatgpt/dtos/messages.dtos';
import { ChatsService } from '../../../chatgpt/services/chats/chats.service';
import { MessagesService } from '../../../chatgpt/services/messages/messages.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(AuthGuard)
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private messageService: MessagesService,
  ) {}

  @Get()
  async getChats(@Request() req) {
    const { id } = req.user;
    return await this.chatsService.getChats(id);
  }

  @Get('options')
  async getOptions() {
    return await this.chatsService.getOptions();
  }

  @Post()
  async createChat(@Request() req) {
    const { id } = req.user;
    const result = await this.chatsService.initChat(id);
    return {
      id: result.id,
      title: result.title,
      messages: [],
    };
  }

  @Post(':id/send-message-openai')
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateMessageDto,
  ) {
    const result = await this.messageService.sendMessage(id, payload.content);

    return result;
  }

  @Patch(':id')
  async updateTitleChat(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload,
  ) {
    const result = await this.chatsService.updateTitleChat(id, payload.title);
    return {
      id: result.id,
      title: result.title,
    };
  }

  @Delete(':id')
  async deleteChat(@Param('id', ParseIntPipe) id: number) {
    return await this.chatsService.deleteChat(id);
  }
}
