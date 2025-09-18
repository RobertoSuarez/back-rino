import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';
import { Chat } from '../../../database/entities/chat.entity';
import { User } from '../../../database/entities/user.entity';
import { ChatMessage } from '../../../database/entities/chatMessage.entity';
import { GeminiService } from '../../../openai/services/gemini/gemini.service';

@Injectable()
export class StudentChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly geminiService: GeminiService,
  ) {}

  async initChat(userId: number): Promise<Chat> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    
    // Verificar si el usuario es un estudiante
    if (user.typeUser !== 'student') {
      throw new ForbiddenException('Solo los estudiantes pueden crear chats de estudiante');
    }
    
    const chat = new Chat();
    chat.title = 'Nuevo chat de estudiante';
    chat.user = user;
    chat.type = 'student'; // Agregamos un tipo para diferenciar los chats de estudiantes
    return await this.chatRepository.save(chat);
  }

  async getChats(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    
    // Verificar si el usuario es un estudiante
    if (user.typeUser !== 'student') {
      throw new ForbiddenException('Solo los estudiantes pueden acceder a los chats de estudiante');
    }
    
    const data = await this.chatRepository.find({
      where: { 
        user: { id: userId }, 
        deletedAt: IsNull(),
        type: 'student' // Solo obtenemos los chats de tipo estudiante
      },
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

  async getMessages(chatId: number, userId: number) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['user'],
    });

    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }

    if (chat.user.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este chat');
    }

    const messages = await this.messageRepository.find({
      where: { chat: { id: chatId } },
      order: { createdAt: 'ASC' },
    });

    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: DateTime.fromISO(message.createdAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
    }));
  }

  async updateTitleChat(id: number, title: string, userId: number): Promise<Chat> {
    const chat = await this.chatRepository.findOne({
      where: { id },
      relations: ['user']
    });
    
    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }
    
    // Verificar que el chat pertenece al usuario
    if (chat.user.id !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este chat');
    }
    
    chat.title = title;
    return await this.chatRepository.save(chat);
  }

  async sendMessage(chatId: number, content: string, userId: number) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['user']
    });
    
    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }
    
    // Verificar que el chat pertenece al usuario
    if (chat.user.id !== userId) {
      throw new ForbiddenException('No tienes permiso para enviar mensajes en este chat');
    }
    
    // Registramos el mensaje del usuario
    const message = new ChatMessage();
    message.role = 'user';
    message.content = content;
    message.chat = chat;
    await this.messageRepository.save(message);

    // Recuperamos los últimos 5 mensajes del chat ordenados por fecha
    const listMessages = await this.messageRepository.find({
      where: { chat: { id: chatId } },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    listMessages.reverse();

    // Generamos la respuesta con el prompt específico para estudiantes
    const responseContent = await this.generateStudentChatResponse(listMessages);

    // Registramos la respuesta en la base de datos
    const messageResponse = new ChatMessage();
    messageResponse.role = 'assistant';
    messageResponse.content = responseContent;
    messageResponse.chat = chat;
    await this.messageRepository.save(messageResponse);

    // Actualizamos la fecha del chat
    chat.updatedAt = new Date();
    await this.chatRepository.save(chat);

    const storedMessages = await this.messageRepository.find({
      where: { id: In([message.id, messageResponse.id]) },
      order: { createdAt: 'ASC' },
    });

    return storedMessages.map((msg) => {
      return {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: DateTime.fromISO(msg.createdAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      };
    });
  }

  async deleteChat(chatId: number, userId: number) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['user']
    });
    
    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }
    
    // Verificar que el chat pertenece al usuario
    if (chat.user.id !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este chat');
    }
    
    await this.chatRepository.softDelete(chatId);
    return {
      ok: true,
    };
  }

  async generateStudentChatResponse(listMessages: ChatMessage[]): Promise<string> {
    // Construir el contexto de la conversación
    let conversationContext = '';
    
    // Agregar mensajes previos al contexto
    listMessages.forEach((message) => {
      if (message.role === 'user') {
        conversationContext += `Estudiante: ${message.content}\n`;
      } else if (message.role === 'assistant') {
        conversationContext += `Amauta: ${message.content}\n`;
      }
    });

    // Crear el prompt completo con el contexto del sistema
    const fullPrompt = `Eres Amauta, un sabio guía inspirado en los chasquis incas, especializado en educar sobre ciberseguridad para la plataforma educativa de gamificación Cyber Imperium.

Tu objetivo es ayudar a los estudiantes EXCLUSIVAMENTE con temas relacionados con ciberseguridad y protección digital, enfocándote en:

1. Phishing y estafas digitales: Cómo identificarlas y protegerse
2. Grooming: Prevención del acoso en línea y captación de menores
3. Catfishing: Suplantación de identidad en redes sociales
4. Sexting y sextorsión: Riesgos y consecuencias
5. Protección contra la trata de personas por medios digitales
6. Prevención del ciberacoso (harassment) y flamming
7. Protección contra el stalking digital
8. Seguridad frente a delitos informáticos
9. Protección contra el hacking y vulnerabilidades
10. Prevención de la pornografía infantil y explotación sexual en línea

IMPORTANTE:
- Siempre reférete a la plataforma como "Cyber Imperium" (no como Rino u otro nombre).
- Usa el concepto de los chasquis incas como metáfora para la transmisión segura de información y protección del conocimiento.
- Mantén un tono educativo, respetuoso y culturalmente apropiado.
- Proporciona explicaciones claras y ejemplos prácticos sobre cómo protegerse en el entorno digital.
- Fomenta el pensamiento crítico y la toma de decisiones seguras en línea.
- Siempre prioriza la seguridad de los jóvenes y adolescentes en tus respuestas.
- Usa markdown para formatear y hacer las respuestas más legibles.
- Si el estudiante pregunta sobre temas no relacionados con ciberseguridad, amablemente redirige la conversación hacia estos temas educativos.
- Trata temas sensibles como sexting, grooming o pornografía infantil con el debido respeto y enfoque educativo.
- Cuando menciones la plataforma, destaca que Cyber Imperium es un espacio educativo de gamificación para aprender sobre ciberseguridad.

Recuerda que tu propósito es ser un guía sabio que transmite conocimientos de ciberseguridad, inspirado en la tradición de los chasquis incas como mensajeros confiables.

Contexto de la conversación:
${conversationContext}

Responde como Amauta de manera educativa, respetuosa y útil.`;

    try {
      // Usar el servicio de Gemini para generar la respuesta
      const response = await this.geminiService.generateContent(fullPrompt);
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido al usar Gemini';
      console.error('Error al generar respuesta con Gemini:', error);
      throw new InternalServerErrorException(
        `No se pudo generar una respuesta. ${message}`,
      );
    }
  }
}
