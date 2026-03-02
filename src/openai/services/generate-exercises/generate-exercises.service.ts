import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { GenerateExerciseDto } from '../../../openai/dtos/exercise.dto';
import { GenerateQuestionDto } from 'src/openai/dtos/questions.dto';
import { GenerateExercisesWithPromptDto, GenerateExercisesResponseDto } from '../../../openai/dtos/exercise-generation.dto';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

@Injectable()
export class GenerateExercisesService {
  constructor(private _configkeyService: ConfigkeyService) { }

  private async getGeminiClient(): Promise<GoogleGenAI> {
    const apiKey = await this._configkeyService.getKeyGemini();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en la base de datos');
    }
    return new GoogleGenAI({ apiKey });
  }

  private readonly toolExerciseSingleSelection: OpenAI.Chat.Completions.ChatCompletionTool =
    {
      type: 'function',
      function: {
        name: 'exerciseSingleSelection',
        description: 'Genera un ejercicio de un solo tipo de selección',
        parameters: {
          type: 'object',
          properties: {
            statement: {
              type: 'string',
              description: 'Enunciado del ejercicio',
            },
            difficulty: {
              type: 'string',
              description: 'Dificultad del ejercicio',
              enum: ['Fácil', 'Medio', 'Difícil'],
            },
            optionSelectOptions: {
              type: 'array',
              description:
                'Opciones de la pregunta, debes generar 4 opciones en total',
              items: {
                type: 'string',
              },
            },
            answerSelectCorrect: {
              type: 'string',
              description: 'Respuesta correcta',
            },
          },
          required: ['statement', 'optionSelectOptions', 'answerSelectCorrect'],
        },
      },
    };

  private readonly toolExerciseMultipleSelection: OpenAI.Chat.Completions.ChatCompletionTool =
    {
      type: 'function',
      function: {
        name: 'exerciseMultipleSelection',
        description: 'Genera un ejercicio de selección multiple',
        parameters: {
          type: 'object',
          properties: {
            statement: {
              type: 'string',
              description: 'Enunciado del ejercicio',
            },
            difficulty: {
              type: 'string',
              description: 'Dificultad del ejercicio',
              enum: ['Fácil', 'Medio', 'Difícil'],
            },
            optionSelectOptions: {
              type: 'array',
              description:
                'Opciones de la pregunta, debes generar 4 opciones en total, 2 correctas y 2 incorrectas',
              items: {
                type: 'string',
              },
            },
            answerSelectsCorrect: {
              type: 'array',
              description: 'Las 3 opciones correctas',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    };

  private readonly toolExerciseOrderFragmentCode: OpenAI.Chat.Completions.ChatCompletionTool =
    {
      type: 'function',
      function: {
        name: 'exerciseOrderFragmentCode',
        description: 'Genera un ejercicio de ordenar fragmentos de código',
        parameters: {
          type: 'object',
          properties: {
            statement: {
              type: 'string',
              description: 'Enunciado del ejercicio',
            },
            difficulty: {
              type: 'string',
              description: 'Dificultad del ejercicio',
              enum: ['Fácil', 'Medio', 'Difícil'],
            },
            optionOrderFragmentCode: {
              type: 'array',
              description:
                'Proporciona opciones de respuesta para la siguiente pregunta, donde cada opción debe ser un fragmento de código. Puedes incluir hasta un máximo de 10 opciones.',
              items: {
                type: 'string',
              },
            },
            answerOrderFragmentCode: {
              type: 'array',
              description:
                'Orden correcto de los fragmentos de código, esta es la respuesta correcta',
              items: {
                type: 'string',
              },
            },
          },
          required: [
            'statement',
            'difficulty',
            'optionOrderFragmentCode',
            'answerOrderFragmentCode',
          ],
        },
      },
    };

  private readonly toolExerciseOrderLineCode: OpenAI.Chat.Completions.ChatCompletionTool =
    {
      type: 'function',
      function: {
        name: 'exerciseOrderLineCode',
        description:
          'Genera un ejercicio donde se toma una linea de código, y se debe ordenar la linea',
        parameters: {
          type: 'object',
          properties: {
            statement: {
              type: 'string',
              description:
                'Proporciona el enunciado del ejercicio, pero no incluyas la respuesta.',
            },
            difficulty: {
              type: 'string',
              description: 'Dificultad del ejercicio',
              enum: ['Fácil', 'Medio', 'Difícil'],
            },
            optionOrderLineCode: {
              type: 'array',
              description:
                'Proporciona opciones de respuesta para la siguiente pregunta, donde cada opción debe ser un fragmento de una línea de código. Puedes incluir hasta un máximo de 8 opciones.',
              items: {
                type: 'string',
              },
            },
            answerOrderLineCode: {
              type: 'array',
              description:
                'Proporciona el orden correcto de los fragmentos de código. Todas las opciones deben estar ordenadas de forma correcta para formar una línea de código completa.',
              items: {
                type: 'string',
              },
            },
          },
          required: [
            'statement',
            'difficulty',
            'optionOrderLineCode',
            'answerOrderLineCode',
          ],
        },
      },
    };

  private readonly toolExerciseWriteCode: OpenAI.Chat.Completions.ChatCompletionTool =
    {
      type: 'function',
      function: {
        name: 'exerciseWriteCode',
        description: 'Genera un ejercicio de escribir código',
        parameters: {
          type: 'object',
          properties: {
            statement: {
              type: 'string',
              description:
                'Enunciado del ejercicio, el usuario debe escribir el código',
            },
            difficulty: {
              type: 'string',
              description: 'Dificultad del ejercicio',
              enum: ['Fácil', 'Medio', 'Difícil'],
            },
          },
        },
      },
    };

  private readonly toolExerciseFindErrorCode: OpenAI.Chat.Completions.ChatCompletionTool =
    {
      type: 'function',
      function: {
        name: 'exerciseFindErrorCode',
        description: 'Genera un ejercicio de encontrar error en el código',
        parameters: {
          type: 'object',
          properties: {
            statement: {
              type: 'string',
              description: 'Enunciado del ejercicio',
            },
            code: {
              type: 'string',
              description:
                'El código del ejercicio que contiene el error, es un fragmento de código dado en markdown',
            },
            difficulty: {
              type: 'string',
              description: 'Dificultad del ejercicio',
              enum: ['Fácil', 'Medio', 'Difícil'],
            },
            optionsFindErrorCode: {
              type: 'array',
              description:
                'Proporciona 4 opciones de respuesta para la siguiente pregunta, donde cada opción debe ser una línea de código distinta',
              items: {
                type: 'string',
              },
            },
            answerFindError: {
              type: 'string',
              description:
                'Respuesta correcta, la linea de código que contiene el error',
            },
          },
          required: [
            'statement',
            'code',
            'difficulty',
            'optionsFindErrorCode',
            'answerFindError',
          ],
        },
      },
    };

  private readonly toolExerciseMatchPairs: OpenAI.Chat.Completions.ChatCompletionTool =
    {
      type: 'function',
      function: {
        name: 'exerciseMatchPairs',
        description: 'Genera un ejercicio de emparejar conceptos',
        parameters: {
          type: 'object',
          properties: {
            statement: {
              type: 'string',
              description: 'Enunciado del ejercicio',
            },
            difficulty: {
              type: 'string',
              description: 'Dificultad del ejercicio',
              enum: ['Fácil', 'Medio', 'Difícil'],
            },
            leftItems: {
              type: 'array',
              description: 'Elementos de la izquierda (4-6 items)',
              items: {
                type: 'string',
              },
            },
            rightItems: {
              type: 'array',
              description: 'Elementos de la derecha (4-6 items)',
              items: {
                type: 'string',
              },
            },
            pairs: {
              type: 'array',
              description: 'Pares correctos [{ left: "item1", right: "item2" }]',
              items: {
                type: 'object',
                properties: {
                  left: { type: 'string' },
                  right: { type: 'string' },
                },
              },
            },
          },
          required: ['statement', 'difficulty', 'leftItems', 'rightItems', 'pairs'],
        },
      },
    };

  exerciseSingleSelection = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeExercise: 'selection_single',
      optionSelectOptions: data.optionSelectOptions,
      optionOrderFragmentCode: [],
      optionOrderLineCode: [],
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: data.answerSelectCorrect,
      answerSelectsCorrect: '',
      answerOrderFragmentCode: [],
      answerOrderLineCode: [],
      answerFindError: '',
    };

    return result;
  };

  questionSingleSelection = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeQuestion: 'selection_single',
      optionSelectOptions: data.optionSelectOptions,
      optionOrderFragmentCode: [],
      optionOrderLineCode: [],
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: data.answerSelectCorrect,
      answerSelectsCorrect: [],
      answerOrderFragmentCode: [],
      answerOrderLineCode: [],
      answerFindError: '',
    };

    return result;
  };

  exerciseMultipleSelection = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeExercise: 'selection_multiple',
      optionSelectOptions: data.optionSelectOptions,
      optionOrderFragmentCode: [],
      optionOrderLineCode: [],
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: data.answerSelectsCorrect,
      answerOrderFragmentCode: [],
      answerOrderLineCode: [],
      answerFindError: '',
    };

    return result;
  };

  questionMultipleSelection = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeQuestion: 'selection_multiple',
      optionSelectOptions: data.optionSelectOptions,
      optionOrderFragmentCode: [],
      optionOrderLineCode: [],
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: data.answerSelectsCorrect,
      answerOrderFragmentCode: [],
      answerOrderLineCode: [],
      answerFindError: '',
    };

    return result;
  };

  exerciseOrderFragmentCode = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeExercise: 'order_fragment_code',
      optionSelectOptions: [],
      optionOrderFragmentCode: data.optionOrderFragmentCode,
      optionOrderLineCode: [],
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: [],
      answerOrderFragmentCode: data.answerOrderFragmentCode,
      answerOrderLineCode: [],
      answerFindError: '',
    };

    return result;
  };

  questionOrderFragmentCode = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeQuestion: 'order_fragment_code',
      optionSelectOptions: [],
      optionOrderFragmentCode: data.optionOrderFragmentCode,
      optionOrderLineCode: [],
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: [],
      answerOrderFragmentCode: data.answerOrderFragmentCode,
      answerOrderLineCode: [],
      answerFindError: '',
    };

    return result;
  };

  exerciseOrderLineCode = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeExercise: 'order_line_code',
      optionSelectOptions: [],
      optionOrderFragmentCode: [],
      optionOrderLineCode: data.optionOrderLineCode,
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: [],
      answerOrderFragmentCode: [],
      answerOrderLineCode: data.answerOrderLineCode,
      answerFindError: '',
    };

    return result;
  };

  questionOrderLineCode = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeQuestion: 'order_line_code',
      optionSelectOptions: [],
      optionOrderFragmentCode: [],
      optionOrderLineCode: data.optionOrderLineCode,
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: [],
      answerOrderFragmentCode: [],
      answerOrderLineCode: data.answerOrderLineCode,
      answerFindError: '',
    };

    return result;
  };

  exerciseWriteCode = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeExercise: 'write_code',
      optionSelectOptions: [],
      optionOrderFragmentCode: [],
      optionOrderLineCode: [],
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: [],
      answerOrderFragmentCode: [],
      answerOrderLineCode: [],
      answerFindError: '',
    };

    return result;
  };

  questionWriteCode = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: '',
      hind: '',
      difficulty: data.difficulty,
      typeQuestion: 'write_code',
      optionSelectOptions: [],
      optionOrderFragmentCode: [],
      optionOrderLineCode: [],
      optionsFindErrorCode: [],

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: [],
      answerOrderFragmentCode: [],
      answerOrderLineCode: [],
      answerFindError: '',
    };

    return result;
  };

  exerciseFindErrorCode = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: data.code,
      hind: '',
      difficulty: data.difficulty,
      typeExercise: 'find_error_code',
      optionSelectOptions: [],
      optionOrderFragmentCode: [],
      optionOrderLineCode: [],
      optionsFindErrorCode: data.optionsFindErrorCode,

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: [],
      answerOrderFragmentCode: [],
      answerOrderLineCode: [],
      answerFindError: data.answerFindError,
    };

    return result;
  };

  questionFindErrorCode = async (args: string) => {
    const data = JSON.parse(args);
    const result = {
      statement: data.statement,
      code: data.code,
      hind: '',
      difficulty: data.difficulty,
      typeQuestion: 'find_error_code',
      optionSelectOptions: [],
      optionOrderFragmentCode: [],
      optionOrderLineCode: [],
      optionsFindErrorCode: data.optionsFindErrorCode,

      // Respuesta correcta.
      answerSelectCorrect: '',
      answerSelectsCorrect: [],
      answerOrderFragmentCode: [],
      answerOrderLineCode: [],
      answerFindError: data.answerFindError,
    };

    return result;
  };

  async generateExercise(payload: GenerateExerciseDto) {
    const ai = await this.getGeminiClient();

    const typeExerciseMap = {
      'selection_single': 'Selección Simple',
      'selection_multiple': 'Selección Múltiple',
      'vertical_ordering': 'Ordenamiento Vertical',
      'horizontal_ordering': 'Ordenamiento Horizontal',
      'phishing_selection_multiple': 'Detección de Phishing',
      'match_pairs': 'Emparejar Conceptos'
    };

    const prompt = `Eres un generador de ejercicios educativos sobre ciberseguridad.

Genera UN ejercicio de tipo "${typeExerciseMap[payload.typeExercise] || payload.typeExercise}" basado en este prompt:
"${payload.prompt}"

Responde SIEMPRE en formato JSON con la siguiente estructura:
{
  "statement": "Enunciado del ejercicio",
  "difficulty": "Fácil",
  "typeExercise": "${payload.typeExercise}",
  "optionSelectOptions": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
  "answerSelectCorrect": "Opción correcta",
  "code": "",
  "hint": ""
}

Para otros tipos de ejercicios, adapta la estructura según sea necesario.`;

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      });

      const responseText = result.text || '';

      try {
        // Intentar parsear como JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const exercise = JSON.parse(jsonMatch[0]);
          exercise.id = this.generateUUID();
          return exercise;
        }
      } catch (e) {
        console.log('No se pudo parsear como JSON');
      }

      // Fallback: retornar ejercicio básico
      return {
        id: this.generateUUID(),
        statement: responseText.substring(0, 200),
        difficulty: 'Medio',
        typeExercise: payload.typeExercise,
        optionSelectOptions: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
        answerSelectCorrect: 'Opción 1',
        code: '',
        hint: ''
      };
    } catch (error) {
      console.error('Error al generar ejercicio con Gemini:', error);
      throw new Error(`Error al generar ejercicio: ${error.message}`);
    }
  }

  async generateQuestion(payload: GenerateQuestionDto) {
    const openai = new OpenAI({
      apiKey: await this._configkeyService.getKeyOpenAI(),
    });
    const prompt = `
    Necesito que generes un array de ${payload.numberOfQuestions} preguntas, asegurándote de que el número de preguntas generadas coincida exactamente con el valor proporcionado en ${payload.numberOfQuestions}. Cada pregunta debe tener la siguiente estructura:

    class CreateQuestionDto {
      assessmentId: number;
      statement: string;
      difficulty: string;
      code?: string;
      hint?: string;
      typeQuestion: 'selection_single' | 'selection_multiple' | 'order_fragment_code' | 'order_line_code' | 'write_code' | 'find_error_code';
      optionSelectOptions?: string[];
      optionOrderFragmentCode?: string[];
      optionOrderCode?: string[];
      optionsFindErrorCode?: string[];
      answerSelectCorrect?: string;
      answerSelectsCorrect?: string[];
      answerOrderFragmentCode?: string[];
      answerOrderLineCode?: string[];
      answerFindError?: string;
    }
    Parámetros de entrada:

    {
      "prompt": "${payload.prompt}",
      "contentFocus": "${payload.contentFocus}"
    }
    Instrucciones detalladas para la generación de preguntas:

    assessmentId: Utiliza un identificador único para cada assessment.
    statement: Desarrolla un enunciado de pregunta basado en el prompt proporcionado.
    difficulty: Asigna un nivel de dificultad ('Fácil', 'Medio', 'Difícil') de forma aleatoria o basada en criterios predefinidos.
    code y hint: Inclúyelos si el tipo de pregunta lo requiere, especialmente en preguntas de tipo 'write_code' o 'find_error_code'.
    typeQuestion: Distribuye equitativamente los tipos de pregunta en la cantidad total especificada, asegurando una representación proporcional de cada tipo.
    Opciones y respuestas:
    Para 'selection_single' o 'selection_multiple', incluye 'optionSelectOptions' y define las respuestas correctas en 'answerSelectCorrect' o 'answerSelectsCorrect'.
    En 'order_fragment_code' o 'order_line_code', proporciona fragmentos de código en 'optionOrderFragmentCode' o 'optionOrderLineCode' y especifica la secuencia correcta en 'answerOrderFragmentCode' o 'answerOrderLineCode'.
    Para 'write_code', provee una respuesta adecuada en 'answer'.
    En 'find_error_code', asegúrate de incluir cuatro opciones en 'optionsFindErrorCode' y señala la opción correcta en 'answerFindError'.
    Control de Calidad:

    Verifica que el número total de preguntas generadas coincida con ${payload.numberOfQuestions}.
    Asegúrate de que cada pregunta de tipo 'find_error_code' contenga exactamente cuatro opciones de respuesta.
    Objetivo:

    Crear un conjunto equilibrado y diverso de preguntas que cubra adecuadamente el tema o habilidad especificada, con una distribución equitativa de los tipos de preguntas y una cantidad precisa según lo requerido.
  `;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Eres un generador de preguntas de programación`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Definimos las tools en base al tipo de enfoque
    let tools = [];
    if (payload.contentFocus === 'Teórica') {
      tools = [this.toolExerciseSingleSelection];
    } else if (payload.contentFocus === 'Teórica/Práctica') {
      tools = [
        this.toolExerciseSingleSelection,
        this.toolExerciseMultipleSelection,
        this.toolExerciseOrderFragmentCode,
        this.toolExerciseOrderLineCode,
        this.toolExerciseWriteCode,
        this.toolExerciseFindErrorCode,
      ];
    }

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages,
      tools,
    });

    const responseMessage = chatCompletion.choices[0].message;
    const tollCalls = responseMessage.tool_calls;

    const preguntas = [];

    if (responseMessage.tool_calls) {
      const availableFunctions = {
        exerciseSingleSelection: this.questionSingleSelection,
        exerciseMultipleSelection: this.questionMultipleSelection,
        exerciseOrderFragmentCode: this.questionOrderFragmentCode,
        exerciseOrderLineCode: this.questionOrderLineCode,
        exerciseWriteCode: this.questionWriteCode,
        exerciseFindErrorCode: this.questionFindErrorCode,
      };
      for (const toolCall of tollCalls) {
        const funcName = toolCall.function.name;
        const funcToCall = availableFunctions[funcName];
        if (!funcToCall) continue;
        const result = await funcToCall(toolCall.function.arguments);
        preguntas.push(result);
      }
    }
    const questionsResult = preguntas.splice(0, payload.numberOfQuestions);

    return {
      count: questionsResult.length,
      questions: questionsResult,
    };
  }

  exerciseMatchPairs = async (args: string) => {
    const data = JSON.parse(args);
    return {
      statement: data.statement,
      difficulty: data.difficulty,
      typeExercise: 'match_pairs',
      leftItems: data.leftItems,
      rightItems: data.rightItems,
      pairs: data.pairs,
      code: '',
      hint: '',
    };
  };


  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ─── Parser robusto: soporta JSON plano o envuelto en markdown ──────────────
  private extractJson(text: string): any {
    // 1) strip markdown code fences: ```json ... ``` o ``` ... ```
    const stripped = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();

    // 2) intenta parsear el texto completo
    const candidates = [stripped, text];
    for (const candidate of candidates) {
      // objeto o array raíz
      for (const regex of [/(\{[\s\S]*\})/, /(\[[\s\S]*\])/]) {
        const match = candidate.match(regex);
        if (match) {
          try { return JSON.parse(match[1]); } catch { }
        }
      }
    }
    return null;
  }

  // ─── Prompt especializado por tipo de ejercicio ──────────────────────────────
  private buildPromptForType(
    type: string,
    payload: GenerateExercisesWithPromptDto,
  ): string {
    const jsonExample = `[
  {
    "statement": "Enunciado claro y preciso de la pregunta",
    "difficulty": "${payload.difficulty}",
    "typeExercise": "${type}",
    "optionSelectOptions": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "answerSelectCorrect": "Opción correcta (exactamente igual a una de optionSelectOptions)",
    "answerSelectsCorrect": ["Correcta 1", "Correcta 2"],
    "optionsVerticalOrdering": ["Paso 1", "Paso 2", "Paso 3"],
    "answerVerticalOrdering": ["Paso 2", "Paso 1", "Paso 3"],
    "optionsHorizontalOrdering": ["Elemento A", "Elemento B"],
    "answerHorizontalOrdering": ["Elemento B", "Elemento A"],
    "optionsPhishingSelection": ["legitimo@banco.com", "segur1dad@banc0.com"],
    "answerPhishingSelection": ["segur1dad@banc0.com"],
    "phishingContext": "Contexto del phishing",
    "leftItems": ["Concepto A", "Concepto B"],
    "rightItems": ["Definición A", "Definición B"],
    "pairs": [
      {"left": "Concepto A", "right": "Definición B"},
      {"left": "Concepto B", "right": "Definición A"}
    ],
    "hint": "Una pista opcional"
  }
]`;

    return `Eres un generador experto de ejercicios educativos sobre ciberseguridad para la plataforma Cyber Imperium.
Debes generar ejercicios claros, precisos y educativos que ayuden a los estudiantes a aprender sobre seguridad digital.
Cada ejercicio debe ser independiente, completo y tener una respuesta correcta clara.

REGLAS CRÍTICAS:
- SIEMPRE responde ÚNICAMENTE con un array JSON válido.
- NUNCA incluyas explicaciones, comentarios o texto fuera del JSON (ni siquiera etiquetas markdown \`\`\`json).
- TEMA a evaluar: "${payload.prompt}"
- CONTEXTO opcional: "${payload.context || 'General'}"
- TIPO de ejercicio que DEBES generar: "${type}"
- DIFICULTAD requerida: "${payload.difficulty}"
- DEBES generar EXACTAMENTE 1 ejercicio de este tipo específico dentro del array.
- TODOS los campos deben existir en el JSON, rellena con arrays vacíos [] o strings vacíos "" los campos que no apliquen a este tipo de ejercicio.
- Las opciones/elementos del tipo solicitado NUNCA deben estar vacíos.

Responde SIEMPRE en formato JSON con un array de ejercicios. Ejemplo de estructura:
${jsonExample}`;
  }

  // ─── Mapea la respuesta de Gemini a la estructura completa esperada por el frontend ──
  private normalizeExercise(raw: any, type: string, difficulty: string): any {
    const base = {
      id: this.generateUUID(),
      statement: raw.statement || 'Sin enunciado',
      difficulty: raw.difficulty || difficulty,
      typeExercise: raw.typeExercise || type,
      code: raw.code || '',
      hint: raw.hint || '',
      // Selección
      optionSelectOptions: raw.optionSelectOptions || [],
      answerSelectCorrect: raw.answerSelectCorrect || '',
      answerSelectsCorrect: raw.answerSelectsCorrect || [],
      // Ordenamiento vertical
      optionsVerticalOrdering: raw.optionsVerticalOrdering || [],
      answerVerticalOrdering: raw.answerVerticalOrdering || [],
      // Ordenamiento horizontal
      optionsHorizontalOrdering: raw.optionsHorizontalOrdering || [],
      answerHorizontalOrdering: raw.answerHorizontalOrdering || [],
      // Phishing
      optionsPhishingSelection: raw.optionsPhishingSelection || [],
      answerPhishingSelection: raw.answerPhishingSelection || [],
      phishingContext: raw.phishingContext || '',
      phishingImageUrl: raw.phishingImageUrl || '',
      // Match pairs
      leftItems: raw.leftItems || [],
      rightItems: raw.rightItems || [],
      pairs: raw.pairs || [],
      // Código
      optionOrderFragmentCode: raw.optionOrderFragmentCode || [],
      answerOrderFragmentCode: raw.answerOrderFragmentCode || [],
      optionOrderLineCode: raw.optionOrderLineCode || [],
      answerOrderLineCode: raw.answerOrderLineCode || [],
      optionsFindErrorCode: raw.optionsFindErrorCode || [],
      answerFindError: raw.answerFindError || '',
      answerWriteCode: raw.answerWriteCode || '',
    };

    // También mapear los campos de payload del backend (match pairs usa leftItems/rightItems)
    return base;
  }

  // ─── Genera UN ejercicio de un tipo específico llamando a Gemini ─────────────
  private async generateOneExercise(
    type: string,
    payload: GenerateExercisesWithPromptDto,
    ai: GoogleGenAI,
  ): Promise<any> {
    const prompt = this.buildPromptForType(type, payload);

    const exerciseSchema = z.object({
      statement: z.string().describe('Enunciado claro y preciso del ejercicio'),
      difficulty: z.string().describe('Fácil, Medio o Difícil'),
      typeExercise: z.string().describe('Exactamente el tipo solicitado, ej: selection_single'),
      hint: z.string().optional().describe('Una pista opcional'),

      optionSelectOptions: z.array(z.string()).optional().describe('Opciones de selección simple/múltiple'),
      answerSelectCorrect: z.string().optional().describe('Respuesta correcta para selección simple'),
      answerSelectsCorrect: z.array(z.string()).optional().describe('Respuestas correctas para selección múltiple'),

      optionsVerticalOrdering: z.array(z.string()).optional().describe('Elementos a ordenar verticalmente'),
      answerVerticalOrdering: z.array(z.string()).optional().describe('Orden correcto vertical'),

      optionsHorizontalOrdering: z.array(z.string()).optional().describe('Elementos a ordenar horizontalmente'),
      answerHorizontalOrdering: z.array(z.string()).optional().describe('Orden correcto horizontal'),

      optionsPhishingSelection: z.array(z.string()).optional().describe('Correos o URLs realistas para evaluar phishing'),
      answerPhishingSelection: z.array(z.string()).optional().describe('Correos o URLs que son efectivamente phishing'),
      phishingContext: z.string().optional().describe('Contexto del escenario de phishing'),

      leftItems: z.array(z.string()).optional().describe('Conceptos de la izquierda (match_pairs)'),
      rightItems: z.array(z.string()).optional().describe('Definiciones a la derecha desordenadas (match_pairs)'),
      pairs: z.array(
        z.object({
          left: z.string(),
          right: z.string()
        })
      ).optional().describe('Pares correctos mapeados (match_pairs)')
    });

    const arraySchema = z.array(exerciseSchema);

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseJsonSchema: zodToJsonSchema(arraySchema as any),
        },
      });

      let raw = this.extractJson(result.text || '');

      // Si la IA responde con un array (ej: [ { statement: ... } ]), tomamos el primer elemento
      if (Array.isArray(raw)) {
        raw = raw[0];
      }

      if (!raw || !raw.statement) {
        console.warn(`[AI] No se pudo parsear ejercicio tipo ${type}, usando fallback. Raw recibido:`, result.text);
        return this.fallbackExercise(type, payload.difficulty);
      }

      return this.normalizeExercise(raw, type, payload.difficulty);
    } catch (err: any) {
      console.error(`[AI] Error generando ejercicio tipo ${type}:`, err.message || err);
      throw new Error(`Error de Gemini (${type}): ${err.message || err}`);
    }
  }

  private fallbackExercise(type: string, difficulty: string): any {
    return this.normalizeExercise({
      statement: `Ejercicio de práctica sobre ciberseguridad (${type})`,
      difficulty,
      typeExercise: type,
    }, type, difficulty);
  }

  // ─── Distribuye los tipos de ejercicio para cubrir la cantidad pedida ────────
  private buildTypesList(exerciseTypes: string[], quantity: number): string[] {
    const result: string[] = [];
    let i = 0;
    while (result.length < quantity) {
      result.push(exerciseTypes[i % exerciseTypes.length]);
      i++;
    }
    return result;
  }

  async generateExercisesWithPrompt(payload: GenerateExercisesWithPromptDto): Promise<GenerateExercisesResponseDto> {
    const ai = await this.getGeminiClient();

    const allTypes = [
      'selection_single',
      'selection_multiple',
      'vertical_ordering',
      'horizontal_ordering',
      'phishing_selection_multiple',
      'match_pairs',
    ];

    const selectedTypes = (payload.exerciseTypes?.length > 0)
      ? payload.exerciseTypes
      : allTypes;

    // Construimos la lista de tipos a generar (1 por ejercicio)
    const typesToGenerate = this.buildTypesList(selectedTypes, payload.quantity);

    const startTime = Date.now();

    // Lanzar todas las generaciones EN PARALELO
    const promises = typesToGenerate.map((type) =>
      this.generateOneExercise(type, payload, ai),
    );

    const exercises = await Promise.all(promises);

    return {
      count: exercises.length,
      exercises,
      generationTime: Date.now() - startTime,
    };
  }
}
