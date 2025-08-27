import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { FeedbackExerciseDto } from '../../../course/dtos/exercises.dtos';
import { ChatMessage } from '../../../database/entities/chatMessage.entity';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MODEL = 'gpt-3.5-turbo-0125';

@Injectable()
export class ChatCompletionService {
  constructor(private _configkeyService: ConfigkeyService) {}

  // Definimos la función la cual registrar la calificación de un usuario.
  private readonly tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'setRegisterQualification',
        description: 'Registra la calificación',
        parameters: {
          type: 'object',
          properties: {
            qualification: {
              type: 'number',
              description: 'Calificación del 0 al 10',
            },
          },
          required: ['qualification'],
        },
      },
    },
  ];

  /**
   * setRegisterQualification es la función que se ejecuta cuando se
   * llama a la función 'setRegisterQualification' en las herramientas del
   * chat completation. Esta función recibe la calificación que se le
   * da al usuario y devuelve un objeto con la calificación y un feedback
   * para el usuario.
   * @param qualification es la calificación que se le da al usuario.
   * @returns un objeto con la calificación y el feedback.
   */
  private setRegisterQualification(qualification: number): {
    qualification: number;
    feedback: string;
  } {
    return {
      qualification: qualification,
      feedback: 'La calificación es de ' + qualification + '. ¡Muchas gracias!',
    };
  }

  /**
   * getFeedbackExerciseGeneric se encarga de comunicarse con OpenAI y generar
   * feedback y ademas obtenemos una calificación en base a la AI.
   * @param prompt es la entrada que se le dará a la AI para generar el feedback.
   * @returns un objeto FeedbackExerciseDto con la calificación y feedback.
   */
  async getFeedbackExerciseGeneric(
    prompt: string,
  ): Promise<FeedbackExerciseDto> {
    const openai = new OpenAI({
      apiKey: await this._configkeyService.getKeyOpenAI(),
    });
    const result: FeedbackExerciseDto = {
      qualification: 0,
      feedback: '',
    };

    // Creamos los mensajes que se enviarán a OpenAI.
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `
            Eres un asistente el cual se encargara de analizar una preguntas y sus respuestas correctas,
            ademas también analizaras la respuesta del usuario para darle una retroalimentación detallada.
            La retroalimentación no le pongas 'Retroalimentación' si no directamente la muestras.
          `,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Llamamos a la API de OpenAI y esperamos la respuesta.
    const chatCompletion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      tools: this.tools,
      tool_choice: 'auto',
      messages: messages,
    });

    // Recuperamos los mensajes.
    const responseMessage = chatCompletion.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // Revisamos que existan tool_calls y llamamos a cada una de ellas.
    if (responseMessage.tool_calls) {
      const availableFunctions = {
        setRegisterQualification: this.setRegisterQualification,
      };
      for (const toolCall of toolCalls) {
        const funcName = toolCall.function.name;
        const funcToCall = availableFunctions[funcName];
        if (!funcToCall) continue;
        const funArgs = JSON.parse(toolCall.function.arguments);
        const { qualification, feedback } = funcToCall(funArgs.qualification);
        result.qualification = qualification;
        messages.push({
          role: 'function',
          name: 'setRegisterQualification',
          content: feedback,
        });
      }
    }

    // Segunda llamada.
    const secondResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      messages: messages,
    });

    // Establecemos el feedback.
    result.feedback = secondResponse.choices[0].message.content;

    return result;
  }

  /**
   * getFeedbackExerciseSelectionSingle se encarga de obtener feedback para un ejercicio
   * de selección de una opción correcta o incorrecta. En este caso la respuesta
   * del usuario es un string y la respuesta correcta también es un string.
   * @param answerSelect es la respuesta del usuario.
   * @param answerSelectCorrect es la respuesta correcta.
   * @param statement es la pregunta/enunciado del ejercicio.
   * @returns un objeto FeedbackExerciseDto con la calificación y feedback.
   */
  async getFeedbackExerciseSelectionSingle(
    answerSelect: string,
    answerSelectCorrect: string,
    statement: string,
  ): Promise<FeedbackExerciseDto> {
    const prompt = `
      Necesito que me ayudes con una retroalimentación sobre la siguiente preguntas:
      ${statement}
      Esta es la respuesta correcta: ${answerSelectCorrect}
      La respuesta del usuario: ${answerSelect}
    `;
    return await this.getFeedbackExerciseGeneric(prompt);
  }

  /**
   * getFeedbackExerciseSelectionMultiple se encarga de obtener feedback para un ejercicio
   * de selección de una opción correcta o incorrecta. En este caso la respuesta
   * del usuario es un array de string y las respuestas correctas también son un array
   * de string.
   * @param statement es la pregunta/enunciado del ejercicio.
   * @param answerSelectsCorrect es las respuestas correctas.
   * @param answerSelect es las respuestas del usuario.
   * @returns un objeto FeedbackExerciseDto con la calificación y feedback.
   */
  async getFeedbackExerciseSelectionMultiple(
    statement: string,
    answerSelectsCorrect: string[],
    answerSelect: string[],
  ): Promise<FeedbackExerciseDto> {
    const prompt = `
      Necesito que me ayudes con una retroalimentación (pero simplemente dame la retroalimentación y no le pongas como texto 'Retroalimentación') sobre la siguiente pregunta:
      ${statement}
      Esta es la respuesta correcta: ${answerSelectsCorrect.join(', \n ')}

      La respuesta del usuario: ${answerSelect.join(', \n ')}
    `;

    return await this.getFeedbackExerciseGeneric(prompt);
  }

  /**
   * getFeedbackExerciseOrdenFragmentCode se encarga de obtener feedback para un ejercicio
   * de orden de un fragmento de código.
   * @param statement es la pregunta/enunciado del ejercicio.
   * @param answerOrderFragmentCodeCorrect es las respuestas correctas.
   * @param answerOrderFragmentCodeUser es las respuestas del usuario.
   * @returns un objeto FeedbackExerciseDto con la calificación y feedback.
   */
  async getFeedbackExerciseOrdenFragmentCode(
    statement: string,
    answerOrderFragmentCodeCorrect: string[],
    answerOrderFragmentCodeUser: string[],
  ): Promise<FeedbackExerciseDto> {
    return await this.getFeedbackExerciseGeneric(
      `Necesito que me des una retroalimentación de las respuesta del usuario, y en base a ese análisis me de una calificación.
      Es importante que registres la calificación.
      Esta es la Pregunta: ${statement}
      Las respuestas correctas: ${answerOrderFragmentCodeCorrect.join(', ')}
      La respuesta del usuario: ${answerOrderFragmentCodeUser.join(', ')}`,
    );
  }

  /**
   * getFeedbackExerciseOrderLineCode se encarga de obtener feedback para un ejercicio
   * de orden de líneas de código. Registra la calificación del usuario.
   * @param statement es la pregunta/enunciado del ejercicio.
   * @param answerOrderLineCode es las respuestas correctas.
   * @param answerOrderLineCodeUser es las respuestas del usuario.
   * @returns un objeto FeedbackExerciseDto con la calificación y feedback.
   */
  async getFeedbackExerciseOrderLineCode(
    statement: string,
    answerOrderLineCode: string[],
    answerOrderLineCodeUser: string[],
  ): Promise<FeedbackExerciseDto> {
    return await this.getFeedbackExerciseGeneric(
      `Necesito que me des una retroalimentación de las respuesta del usuario, y en base a ese análisis me de una calificación.
      Es importante que registres la calificación.
      Esta es la Pregunta: ${statement}
      Las respuestas correctas: ${answerOrderLineCode.join(', ')}
      La respuesta del usuario: ${answerOrderLineCodeUser.join(', ')}`,
    );
  }

  /**
   * getFeedbackExerciseFindError se encarga de obtener feedback para un ejercicio
   * de búsqueda de error. Registra la calificación del usuario.
   * @param statement es la pregunta/enunciado del ejercicio.
   * @param correctAnswerFindError es la respuesta correcta.
   * @param userAnswerFindError es la respuesta del usuario.
   * @returns un objeto FeedbackExerciseDto con la calificación y feedback.
   */
  async getFeedbackExerciseFindError(
    statement: string,
    correctAnswerFindError: string,
    userAnswerFindError: string,
  ): Promise<FeedbackExerciseDto> {
    return await this.getFeedbackExerciseGeneric(
      `Necesito que me des una retroalimentación de las respuesta del usuario.
      Esta es la Pregunta: ${statement}
      La respuesta correcta: ${correctAnswerFindError}
      La respuesta del usuario: ${userAnswerFindError}`,
    );
  }

  async getScoreExerciseWriteCode(statement: string, answer: string) {
    const result = await this.getFeedbackExerciseGeneric(
      `Necesito que me des una retroalimentación y registres una calificación de las respuesta del usuario si o si.
      Esta es la Pregunta: ${statement}
      La respuesta del usuario: ${answer}`,
    );

    return result.qualification;
  }

  /**
   * getFeedbackExerciseWriteCode se encarga de obtener feedback para un ejercicio
   * de escritura de código. En este caso la respuesta del usuario es un string
   * y la función devuelve un objeto FeedbackExerciseDto con la calificación y
   * feedback.
   * @param statement es la pregunta/enunciado del ejercicio.
   * @param answer es la respuesta del usuario.
   * @returns un objeto FeedbackExerciseDto con la calificación y feedback.
   */
  async getFeedbackExerciseWriteCode(
    statement: string,
    answer: string,
  ): Promise<FeedbackExerciseDto> {
    const result = await this.getFeedbackExerciseGeneric(
      `
      Por favor, dame tu retroalimentación y registra una calificación con las functions setRegisterQualification. La calificación debe estar entre 0 y 10. en caso de errores la calificación debe estar de acuerdo a la magnitud del error. No utilices la palabra 'Retroalimentación', simplemente muestra la retroalimentación directamente. Asegúrate de que la calificación esté dentro del rango de 0 a 10. Si la respuesta es "bien" o "casi bien", asigna automáticamente una calificación de 10.

      Esta es la pregunta: ${statement}

      Respuesta del usuario: ${answer}
      `,
    );
    return result;
  }

  async generateResponseChatCompletion(listMessages: ChatMessage[]) {
    const openai = new OpenAI({
      apiKey: await this._configkeyService.getKeyOpenAI(),
    });
    const messagesGPT: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      listMessages.map((message) => {
        return {
          role: message.role,
          content: message.content,
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
      });

    messagesGPT.unshift({
      role: 'system',
      content:
        'Tu eres un asistente el cual se encarga de dar respuestas a las preguntas de alumnos de programación.',
    });
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: messagesGPT,
    });

    return response;
  }
}
