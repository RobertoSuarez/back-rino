import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateExerciseDto } from '../../../openai/dtos/exercise.dto';
import { GenerateQuestionDto } from 'src/openai/dtos/questions.dto';
import { GenerateExercisesWithPromptDto, GenerateExercisesResponseDto } from '../../../openai/dtos/exercise-generation.dto';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

@Injectable()
export class GenerateExercisesService {
  constructor(private _configkeyService: ConfigkeyService) {}

  private async getGeminiClient() {
    const apiKey = await this._configkeyService.getKeyGemini();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en la base de datos');
    }
    return new GoogleGenerativeAI(apiKey);
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
    const genAI = await this.getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' });

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
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      });

      const responseText = result.response.text();
      
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private buildGenerationPrompt(payload: GenerateExercisesWithPromptDto, types: string[]): string {
    return `
Necesito que generes exactamente ${payload.quantity} ejercicios educativos sobre ciberseguridad.

PARÁMETROS:
- Tema/Prompt: ${payload.prompt}
- Dificultad: ${payload.difficulty}
- Contexto: ${payload.context || 'General'}
- Tipos de ejercicios: ${types.join(', ')}

INSTRUCCIONES DETALLADAS:
1. Genera exactamente ${payload.quantity} ejercicios
2. Distribuye los tipos de ejercicios de manera equilibrada
3. Cada ejercicio debe ser único, educativo y completo
4. IMPORTANTE: Asegúrate de completar TODAS las opciones/elementos requeridos
5. Para selección_single: proporciona EXACTAMENTE 4 opciones, una correcta
6. Para selección_multiple: proporciona EXACTAMENTE 4 opciones, 2 correctas y 2 incorrectas
7. Para vertical_ordering: proporciona EXACTAMENTE 5 elementos para ordenar
8. Para horizontal_ordering: proporciona EXACTAMENTE 5 elementos para ordenar
9. Para phishing_selection_multiple: proporciona EXACTAMENTE 4 opciones de URLs/emails
10. Para match_pairs: proporciona EXACTAMENTE 5 pares (izquierda y derecha)

ESTRUCTURA JSON REQUERIDA:
{
  "statement": "Pregunta clara y educativa",
  "difficulty": "Fácil|Medio|Difícil",
  "typeExercise": "selection_single|selection_multiple|vertical_ordering|horizontal_ordering|phishing_selection_multiple|match_pairs",
  "optionSelectOptions": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
  "answerSelectCorrect": "Opción correcta",
  "answerSelectsCorrect": ["Opción 1", "Opción 2"],
  "optionsVerticalOrdering": ["Elemento 1", "Elemento 2", "Elemento 3", "Elemento 4", "Elemento 5"],
  "answerVerticalOrdering": ["Elemento 3", "Elemento 1", "Elemento 4", "Elemento 2", "Elemento 5"],
  "optionsHorizontalOrdering": ["Elemento 1", "Elemento 2", "Elemento 3", "Elemento 4", "Elemento 5"],
  "answerHorizontalOrdering": ["Elemento 2", "Elemento 4", "Elemento 1", "Elemento 5", "Elemento 3"],
  "optionsPhishingSelection": ["email@legitimo.com", "phishing@falso.com", "correo@empresa.com", "estafa@malicioso.com"],
  "answerPhishingSelection": ["phishing@falso.com", "estafa@malicioso.com"],
  "leftItems": ["Concepto 1", "Concepto 2", "Concepto 3", "Concepto 4", "Concepto 5"],
  "rightItems": ["Definición A", "Definición B", "Definición C", "Definición D", "Definición E"],
  "pairs": [{"left": "Concepto 1", "right": "Definición A"}, ...]
}

TEMAS DE CIBERSEGURIDAD A CONSIDERAR:
- Phishing y estafas digitales
- Grooming y captación de menores
- Identidad digital y suplantación
- Sexting y sextorsión
- Ciberacoso (harassment)
- Stalking digital
- Hacking y seguridad de contraseñas
- Privacidad en redes sociales
    `;
  }

  private balanceExerciseTypes(types: string[], quantity: number): string[] {
    const result: string[] = [];
    const typeCount = Math.ceil(quantity / types.length);
    
    for (const type of types) {
      for (let i = 0; i < typeCount && result.length < quantity; i++) {
        result.push(type);
      }
    }
    
    return result.slice(0, quantity);
  }

  private parseGeminiResponse(responseText: string, quantity: number, difficulty: string) {
    const exercises = [];
    
    try {
      // Intentar parsear como JSON
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, quantity).map(ex => this.completeExerciseData(ex, difficulty));
        }
      }
    } catch (e) {
      console.log('No se pudo parsear como JSON, intentando extracción manual');
    }

    // Fallback: crear ejercicios básicos a partir del texto
    const exerciseBlocks = responseText.split(/(?=Ejercicio \d+:|^)/i).filter(b => b.trim());
    
    for (let i = 0; i < Math.min(exerciseBlocks.length, quantity); i++) {
      const block = exerciseBlocks[i];
      exercises.push({
        id: this.generateUUID(),
        statement: block.substring(0, 200),
        difficulty: difficulty,
        typeExercise: 'selection_single',
        optionSelectOptions: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
        answerSelectCorrect: 'Opción 1',
        code: '',
        hint: ''
      });
    }

    return exercises.slice(0, quantity);
  }

  private completeExerciseData(exercise: any, difficulty: string): any {
    const completed = {
      id: this.generateUUID(),
      statement: exercise.statement || 'Pregunta sin enunciado',
      difficulty: exercise.difficulty || difficulty,
      typeExercise: exercise.typeExercise || 'selection_single',
      code: exercise.code || '',
      hint: exercise.hint || '',
      // Campos para selección
      optionSelectOptions: exercise.optionSelectOptions || ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
      answerSelectCorrect: exercise.answerSelectCorrect || 'Opción 1',
      answerSelectsCorrect: exercise.answerSelectsCorrect || [],
      // Campos para ordenamiento vertical
      optionsVerticalOrdering: exercise.optionsVerticalOrdering || exercise.optionSelectOptions || ['Elemento 1', 'Elemento 2', 'Elemento 3', 'Elemento 4', 'Elemento 5'],
      answerVerticalOrdering: exercise.answerVerticalOrdering || [],
      // Campos para ordenamiento horizontal
      optionsHorizontalOrdering: exercise.optionsHorizontalOrdering || exercise.optionSelectOptions || ['Elemento 1', 'Elemento 2', 'Elemento 3', 'Elemento 4', 'Elemento 5'],
      answerHorizontalOrdering: exercise.answerHorizontalOrdering || [],
      // Campos para phishing
      optionsPhishingSelection: exercise.optionsPhishingSelection || exercise.optionSelectOptions || ['email@legitimo.com', 'phishing@falso.com', 'correo@empresa.com', 'estafa@malicioso.com'],
      answerPhishingSelection: exercise.answerPhishingSelection || exercise.answerSelectsCorrect || [],
      phishingContext: exercise.phishingContext || '',
      phishingImageUrl: exercise.phishingImageUrl || '',
      // Campos para match pairs
      optionsMatchPairsLeft: exercise.leftItems || exercise.optionsMatchPairsLeft || ['Concepto 1', 'Concepto 2', 'Concepto 3', 'Concepto 4', 'Concepto 5'],
      optionsMatchPairsRight: exercise.rightItems || exercise.optionsMatchPairsRight || ['Definición A', 'Definición B', 'Definición C', 'Definición D', 'Definición E'],
      answerMatchPairs: exercise.pairs || exercise.answerMatchPairs || [],
      // Campos para código
      optionOrderFragmentCode: exercise.optionOrderFragmentCode || [],
      answerOrderFragmentCode: exercise.answerOrderFragmentCode || [],
      optionOrderLineCode: exercise.optionOrderLineCode || [],
      answerOrderLineCode: exercise.answerOrderLineCode || [],
      optionsFindErrorCode: exercise.optionsFindErrorCode || [],
      answerFindError: exercise.answerFindError || '',
      answerWriteCode: exercise.answerWriteCode || ''
    };

    return completed;
  }

  async generateExercisesWithPrompt(payload: GenerateExercisesWithPromptDto): Promise<GenerateExercisesResponseDto> {
    const genAI = await this.getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' });

    // Determinar tipos de ejercicios a generar
    const exerciseTypes = payload.exerciseTypes?.length > 0 
      ? payload.exerciseTypes 
      : [
          'selection_single',
          'selection_multiple',
          'vertical_ordering',
          'horizontal_ordering',
          'phishing_selection_multiple',
          'match_pairs'
        ];

    // Si balanceTypes es true, distribuir equitativamente
    let typesToGenerate = exerciseTypes;
    if (payload.balanceTypes && exerciseTypes.length > 0) {
      typesToGenerate = this.balanceExerciseTypes(exerciseTypes, payload.quantity);
    }

    const prompt = this.buildGenerationPrompt(payload, typesToGenerate);

    const systemPrompt = `Eres un generador experto de ejercicios educativos sobre ciberseguridad para la plataforma Cyber Imperium. 
Debes generar ejercicios claros, precisos y educativos que ayuden a los estudiantes a aprender sobre seguridad digital.
Cada ejercicio debe ser independiente, completo y tener una respuesta correcta clara.

REGLAS CRÍTICAS:
- SIEMPRE responde ÚNICAMENTE con un array JSON válido
- NUNCA incluyas explicaciones, comentarios o texto fuera del JSON
- TODOS los campos deben estar completos y rellenos
- Las opciones/elementos NUNCA deben estar vacíos
- Cada tipo de ejercicio debe tener sus campos específicos completos

Responde SIEMPRE en formato JSON con un array de ejercicios. Ejemplo:
[
  {
    "statement": "¿Qué es phishing?",
    "difficulty": "Fácil",
    "typeExercise": "selection_single",
    "optionSelectOptions": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "answerSelectCorrect": "Opción correcta"
  }
]`;

    const startTime = Date.now();

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: systemPrompt + '\n\n' + prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      });

      const responseText = result.response.text();
      const exercises = this.parseGeminiResponse(responseText, payload.quantity, payload.difficulty);

      return {
        count: exercises.length,
        exercises,
        generationTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error al generar ejercicios con Gemini:', error);
      throw new Error(`Error al generar ejercicios: ${error.message}`);
    }
  }
}
