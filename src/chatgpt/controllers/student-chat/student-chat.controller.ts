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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMessageDto } from '../../../chatgpt/dtos/messages.dtos';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';
import { StudentChatService } from '../../services/student-chat/student-chat.service';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';

@ApiTags('Chat de Estudiantes')
@Controller('student-chat')
@UseGuards(AuthGuard)
export class StudentChatController {
  constructor(
    private studentChatService: StudentChatService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtiene todos los chats del estudiante' })
  async getChats(@Request() req) {
    const { id } = req.user;
    return await this.studentChatService.getChats(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo chat para el estudiante' })
  async createChat(@Request() req) {
    const { id } = req.user;
    const result = await this.studentChatService.initChat(id);
    return {
      id: result.id,
      title: result.title,
      createdAt: DateTime.fromISO(result.createdAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      updatedAt: DateTime.fromISO(result.updatedAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      messages: [],
    };
  }

  @Post(':id/send-message')
  @ApiOperation({ summary: 'Envía un mensaje al chat de estudiante y obtiene respuesta del asistente IA' })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateMessageDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    const result = await this.studentChatService.sendMessage(id, payload.content, userId);
    return result;
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Obtiene los mensajes de un chat de estudiante' })
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const userId = req.user.id;
    return await this.studentChatService.getMessages(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza el título de un chat' })
  async updateTitleChat(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload,
    @Request() req,
  ) {
    const userId = req.user.id;
    const result = await this.studentChatService.updateTitleChat(id, payload.title, userId);
    return {
      id: result.id,
      title: result.title,
      updatedAt: DateTime.fromISO(result.updatedAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina un chat' })
  async deleteChat(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const userId = req.user.id;
    return await this.studentChatService.deleteChat(id, userId);
  }
}
