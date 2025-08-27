import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GenerateExerciseDto } from '../../../openai/dtos/exercise.dto';
import { GenerateQuestionDto } from 'src/openai/dtos/questions.dto';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

@Injectable()
export class GenerateExercisesService {
  constructor(private _configkeyService: ConfigkeyService) {}

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
    console.log(args);
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
    console.log(args);
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
    console.log(args);
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
    console.log(args);
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
    console.log(args);
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
    console.log(args);
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
    console.log(args);
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
    console.log(args);
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
    console.log(args);
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
    console.log(args);
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

  async generateExercise(payload: GenerateExerciseDto) {
    const openai = new OpenAI({
      apiKey: await this._configkeyService.getKeyOpenAI(),
    });
    let result;
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Eres un generador de preguntas de programación`,
      },
      {
        role: 'user',
        content: payload.prompt,
      },
    ];

    const tools = [];
    switch (payload.typeExercise) {
      case 'selection_single':
        tools.push(this.toolExerciseSingleSelection);
        break;
      case 'selection_multiple':
        // tools.push(this.toolExerciseMultipleSelection);
        tools.push(this.toolExerciseMultipleSelection);
        break;
      case 'order_fragment_code':
        tools.push(this.toolExerciseOrderFragmentCode);
        break;
      case 'order_line_code':
        tools.push(this.toolExerciseOrderLineCode);
        break;
      case 'write_code':
        tools.push(this.toolExerciseWriteCode);
        break;
      case 'find_error_code':
        tools.push(this.toolExerciseFindErrorCode);
        break;
    }

    // Generador de preguntas
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      temperature: 0.7,
      tools,
      messages,
    });

    const responseMessage = chatCompletion.choices[0].message;
    const tollCalls = responseMessage.tool_calls;

    if (responseMessage.tool_calls) {
      const availableFunctions = {
        exerciseSingleSelection: this.exerciseSingleSelection,
        exerciseMultipleSelection: this.exerciseMultipleSelection,
        exerciseOrderFragmentCode: this.exerciseOrderFragmentCode,
        exerciseOrderLineCode: this.exerciseOrderLineCode,
        exerciseWriteCode: this.exerciseWriteCode,
        exerciseFindErrorCode: this.exerciseFindErrorCode,
      };
      for (const toolCall of tollCalls) {
        const funcName = toolCall.function.name;
        const funcToCall = availableFunctions[funcName];
        if (!funcToCall) continue;
        result = await funcToCall(toolCall.function.arguments);
      }
    }
    return result;
  }
}
