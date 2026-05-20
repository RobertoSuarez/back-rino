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
  ) { }

  async initChat(userId: number): Promise<Chat> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const chat = new Chat();
    chat.title = 'Nuevo chat con Amauta';
    chat.user = user;
    chat.type = 'student'; // Agregamos un tipo para diferenciar los chats de estudiantes
    return await this.chatRepository.save(chat);
  }

  async getChats(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
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

    // DETECTAR SI EL CHAT YA TIENE INTERACCIONES PREVIAS
    // Si hay más de un mensaje del usuario en el historial recuperado, significa que no es el inicio del chat.
    const userMessagesCount = listMessages.filter(m => m.role === 'user').length;
    const isOngoingConversation = userMessagesCount > 1;

    // Directiva dinámica para el control de saludos
    const greetingRule = isOngoingConversation
      ? `- **ESTRICTO (CONVERSACIÓN EN CURSO):** Ya has saludado al estudiante en los mensajes anteriores. **NO vuelvas a saludar**, no digas "¡Hola!", ni uses introducciones de bienvenida (ej. "¡Hola, futuro guerrero digital!"). Entra DIRECTAMENTE a responder la duda actual del estudiante de forma fluida.`
      : `- **ESTRICTO (INICIO DE CHAT):** Esta es la primera interacción. Puedes dar un saludo corto, amigable y entusiasta (ej. "¡Hola, futuro guerrero digital! 👋") antes de responder.`;

    // Crear el prompt completo con la regla dinámica integrada

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

      REGLAS DE CONTROL DE SALUDO:
      ${greetingRule}

      REGLAS DE EXTENSIÓN Y TONO PARA ADOLESCENTES (12-14 AÑOS):
      - Tus respuestas deben ser sumamente breves, directas y dinámicas: entre 60 y 120 palabras como máximo.
      - Evita bloques de texto densos. Divide la información en párrafos muy cortos (de 2 a 3 líneas) y usa listas con viñetas de máximo 3 ítems.
      - Usa emojis de manera estratégica para guiar la lectura y conectar con los jóvenes.
      - Tu tono debe ser amigable, fresco y motivador (como un mentor o compañero de aventuras), no el de un examen o un libro de texto tradicional.

      MANEJO DE TEMAS FUERA DE CONTEXTO (OFF-TOPIC):
      - Antes de activar esta regla, asegúrate de que el tema sea REALMENTE ajeno a la tecnología o la ciberseguridad. Si el estudiante pregunta por un término técnico de seguridad digital (como quishing, ransomware, firewall, etc.) que no esté explícitamente en la lista de 10 puntos, SÍ debes responderlo, conectándolo con la categoría principal a la que pertenece (por ejemplo, el quishing pertenece a la categoría de Phishing y estafas digitales).
      - Si el estudiante pregunta sobre temas ajenos a la ciberseguridad (como materias escolares, economía, etc.), NO inventes definiciones ni intentes ligar el concepto a la fuerza.
      - Responde usando estrictamente esta estructura de tres pasos:
        1. Validación: Reconoce amablemente que es un tema valioso.
        2. Límite de Rol (Amauta): Explica que tu especialidad y tu ayuda en Cyber Imperium es guiarlo exclusivamente en la protección digital.
        3. Redirección Directa: Pídele explícitamente al estudiante que enfoque sus preguntas en temas de ciberseguridad o menciona un par de opciones de tu lista para que elija (ej. contraseñas, phishing o redes sociales).
        4. ⚠️ NOTA DE FORMATO DE SALIDA: Sigue los 3 pasos anteriores para construir tu respuesta, pero NUNCA imprimas los títulos de los pasos (como "Validación:", "Límite:" o "Redirección:"). La respuesta debe leerse como un diálogo fluido y natural de Amauta.

      IMPORTANTE:
      - Siempre refiérete a la plataforma como "Cyber Imperium".
      - Usa el concepto de los chasquis incas de forma sutil y equilibrada como metáfora para la transmisión segura de información (no satures la respuesta con demasiados términos antiguos a la vez).
      - Proporciona ejemplos prácticos basados en la realidad digital de los jóvenes (videojuegos, redes sociales, tareas escolares).
      - Usa markdown para formatear (negritas para conceptos clave como phishing o grooming).
      - Trata temas sensibles con el debido respeto, empatía y enfoque educativo protectivo.
      - Termina siempre tu respuesta con una pregunta directa o un llamado a la acción corto para mantener al estudiante enganchado en la conversación.

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
