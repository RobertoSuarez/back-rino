import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

@Injectable()
export class ChaptersGPTService {
  constructor(private _configkeyService: ConfigkeyService) {}

  private readonly ChaptersTool: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: 'function',
    function: {
      name: 'chapters',
      description: 'Genera una lista de capítulos',
      parameters: {
        type: 'object',
        properties: {
          chapters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Título del capítulo',
                },
                shortDescription: {
                  type: 'string',
                  description: 'Breve descripción del capítulo',
                },
                difficulty: {
                  type: 'string',
                  description: 'Nivel de dificultad, Fácil, Medio o Difícil',
                  enum: ['Fácil', 'Medio', 'Difícil'],
                },
              },
              required: ['title', 'shortDescription', 'difficulty'],
            },
          },
        },
        required: ['chapters'],
      },
    },
  };

  private readonly TemasTool: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: 'function',
    function: {
      name: 'temas',
      description: 'Genera una lista de capítulos',
      parameters: {
        type: 'object',
        properties: {
          temas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Título del capítulo',
                },
                shortDescription: {
                  type: 'string',
                  description: 'Breve descripción del capítulo',
                },
                theory: {
                  type: 'string',
                  description: 'La teoría del tema',
                },
                difficulty: {
                  type: 'string',
                  description: 'Nivel de dificultad, Fácil, Medio o Difícil',
                  enum: ['Fácil', 'Medio', 'Difícil'],
                },
              },
              required: ['title', 'shortDescription', 'theory', 'difficulty'],
            },
          },
        },
        required: ['temas'],
      },
    },
  };

  async getTemas(prompt: string) {
    const openai = new OpenAI({
      apiKey: await this._configkeyService.getKeyOpenAI(),
    });
    let result = [];
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Eres un generador de temas que se enfoca en el ámbito de la programación`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: [this.TemasTool],
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (responseMessage.tool_calls) {
      for (const call of toolCalls) {
        const { arguments: args } = call.function;
        result = JSON.parse(args);
      }
    }

    return result;
  }

  async getChapters(prompt: string) {
    const openai = new OpenAI({
      apiKey: await this._configkeyService.getKeyOpenAI(),
    });
    let result = [];
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Eres un generador de capítulos que se enfoca en el ámbito de la programación`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: [this.ChaptersTool],
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (responseMessage.tool_calls) {
      for (const call of toolCalls) {
        const { arguments: args } = call.function;
        result = JSON.parse(args);
      }
    }

    return result;
  }
}
