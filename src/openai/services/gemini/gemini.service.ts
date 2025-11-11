import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
} from '@google/generative-ai';
import { FeedbackExerciseDto } from '../../../course/dtos/exercises.dtos';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private generativeAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private modelInitialization: Promise<void> | null = null;
  private readonly defaultModel = 'gemini-2.0-flash-lite-001';

  constructor(
    private readonly configService: ConfigService,
    private readonly configkeyService: ConfigkeyService,
  ) {}

  private async resolveApiKey(): Promise<string | null> {
    const keyFromDb = await this.configkeyService.getKeyGemini();
    if (keyFromDb) {
      return keyFromDb;
    }

    const keyFromEnv = this.configService.get<string>('GOOGLE_API_KEY');
    if (keyFromEnv) {
      return keyFromEnv;
    }

    this.logger.error('Gemini API key not configured');
    return null;
  }

  private async ensureModel(): Promise<GenerativeModel> {
    if (this.model) {
      return this.model;
    }

    if (!this.modelInitialization) {
      this.modelInitialization = (async () => {
        const apiKey = await this.resolveApiKey();
        if (!apiKey) {
          throw new Error(
            'Gemini API key not configured. Please configure it before using the service.',
          );
        }

        this.generativeAI = new GoogleGenerativeAI(apiKey);
        this.model = this.generativeAI.getGenerativeModel({
          model: this.defaultModel,
        });
      })();
    }

    await this.modelInitialization;

    if (!this.model) {
      throw new Error('Gemini model could not be initialised');
    }

    return this.model;
  }

  /**
   * Genera una descripción para un curso basado en su título
   * @param title Título del curso
   * @returns Descripción generada
   */
  async generateCourseDescription(title: string): Promise<string> {
    const prompt = `Genera una descripción detallada y atractiva para un curso educativo titulado "${title}". 
    La descripción debe ser un párrafo único, destacar los beneficios del curso y que tiene ac, 
    a quién va dirigido (estudiantes de Educación General Básica Superior que generalmente tienen entre 12 a 14 años) 
    y qué aprenderán los estudiantes. Usa un tono profesional pero amigable.
    No quiero que digas explícitamente que es para estudiantes de Educación General Básica Superior ni la edad.
    Ya que ellos mismos van a poder leer esa descripción`;

    return this.generateContent(prompt);
  }

  /**
   * Genera una descripción para un capítulo basado en su título y el contexto del curso
   * @param chapterTitle Título del capítulo
   * @param courseTitle Título del curso al que pertenece
   * @param courseDescription Descripción del curso
   * @returns Descripción generada
   */
  async generateChapterDescription(
    chapterTitle: string,
    courseTitle: string,
    courseDescription: string,
  ): Promise<string> {
    const prompt = `Genera una descripción concisa y clara para un capítulo titulado "${chapterTitle}" 
    que forma parte del curso "${courseTitle}". Contexto del curso: "${courseDescription}".
    La descripción debe tener entre 80 y 120 palabras, explicar qué temas se cubrirán en este capítulo 
    y cómo se relaciona con el objetivo general del curso.`;

    return this.generateContent(prompt);
  }

  /**
   * Genera contenido para un tema basado en su título, capítulo y curso
   * @param temaTitle Título del tema
   * @param chapterTitle Título del capítulo
   * @param courseTitle Título del curso
   * @returns Objeto con descripción corta y teoría completa
   */
  async generateTemaContent(
    temaTitle: string,
    chapterTitle: string,
    courseTitle: string,
  ): Promise<{ shortDescription: string; theory: string }> {
    // Generar descripción corta
    const shortDescPrompt = `Genera una descripción breve (máximo 50 palabras) para un tema educativo titulado "${temaTitle}" 
    que forma parte del capítulo "${chapterTitle}" en el curso "${courseTitle}".`;
    
    const shortDescription = await this.generateContent(shortDescPrompt);

    // Generar teoría completa
    const theoryPrompt = `Genera contenido educativo completo y detallado para un tema titulado "${temaTitle}" 
    que forma parte del capítulo "${chapterTitle}" en el curso "${courseTitle}".
    El contenido debe incluir:
    1. Una introducción al tema
    2. Desarrollo de los conceptos principales
    3. Ejemplos prácticos cuando sea posible
    4. Conclusión o resumen
    
    El contenido debe ser informativo, bien estructurado y con un enfoque didáctico.
    Extensión aproximada: 500-800 palabras.`;
    
    const theory = await this.generateContent(theoryPrompt);

    return { shortDescription, theory };
  }

  /**
   * Genera teoría con un prompt personalizado del usuario
   * @param prompt Prompt personalizado del usuario
   * @param temaTitle Título del tema
   * @param chapterTitle Título del capítulo
   * @param courseTitle Título del curso
   * @returns Teoría generada en HTML con emojis y estructura atractiva
   */
  async generateTheoryWithPrompt(
    prompt: string,
    temaTitle: string,
    chapterTitle: string,
    courseTitle: string,
  ): Promise<string> {
    const theoryPrompt = `Eres un profesor de ciberseguridad creativo y entusiasta que crea contenido educativo para estudiantes de 12-14 años.

CONTEXTO:
- Tema: ${temaTitle}
- Capítulo: ${chapterTitle}
- Curso: ${courseTitle}

SOLICITUD DEL USUARIO:
${prompt}

INSTRUCCIONES IMPORTANTES:
1. Genera contenido en HTML válido (puedes usar etiquetas HTML básicas como <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>)
2. INCLUYE EMOJIS RELEVANTES en los títulos y puntos clave para hacerlo atractivo
3. Estructura el contenido de forma llamativa y fácil de entender:
   - Comienza con una introducción enganchante
   - Usa encabezados para organizar las secciones
   - Incluye viñetas o listas numeradas
   - Destaca conceptos importantes con <strong>
   - Usa emojis para ilustrar ideas (🔒 para seguridad, ⚠️ para advertencias, ✅ para consejos, 🎯 para objetivos, etc.)
4. Mantén un tono amigable y motivador
5. Incluye ejemplos prácticos y relevantes
6. Termina con un resumen o conclusión
7. Extensión: 600-1000 palabras
8. Asegúrate de que sea educativo pero entretenido

IMPORTANTE: Responde ÚNICAMENTE con el HTML del contenido, sin explicaciones adicionales.`;

    return await this.generateContent(theoryPrompt);
  }

  /**
   * Genera feedback para ejercicio de selección única
   * @param answerSelect Respuesta del usuario
   * @param answerSelectCorrect Respuesta correcta
   * @param statement Enunciado del ejercicio
   * @returns Feedback con calificación
   */
  async getFeedbackExerciseSelectionSingle(
    answerSelect: string,
    answerSelectCorrect: string,
    statement: string,
  ): Promise<FeedbackExerciseDto> {
    const prompt = `Evalúa la respuesta del usuario y proporciona retroalimentación educativa.

PREGUNTA: ${statement}
RESPUESTA CORRECTA: ${answerSelectCorrect}
RESPUESTA DEL USUARIO: ${answerSelect}

INSTRUCCIONES:
- Si la respuesta es correcta, felicita al usuario
- Si es incorrecta, explica por qué y proporciona la información correcta
- Sé constructivo y educativo

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional:

{
  "qualification": [número entero del 0 al 10],
  "feedback": "[tu retroalimentación educativa aquí]"
}`;

    return this.getFeedbackExerciseGeneric(prompt);
  }

  /**
   * Genera feedback para ejercicio de selección múltiple
   * @param statement Enunciado del ejercicio
   * @param answerSelectsCorrect Respuestas correctas
   * @param answerSelect Respuestas del usuario
   * @returns Feedback con calificación
   */
  async getFeedbackExerciseSelectionMultiple(
    statement: string,
    answerSelectsCorrect: string[],
    answerSelect: string[],
  ): Promise<FeedbackExerciseDto> {
    const prompt = `Evalúa la respuesta del usuario en un ejercicio de selección múltiple.

PREGUNTA: ${statement}
RESPUESTAS CORRECTAS: ${answerSelectsCorrect.join(', ')}
RESPUESTAS DEL USUARIO: ${answerSelect.join(', ')}

INSTRUCCIONES:
- Menciona qué opciones seleccionó correctamente y cuáles no
- Explica por qué cada opción es correcta o incorrecta
- Proporciona retroalimentación constructiva y educativa

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional:

{
  "qualification": [número entero del 0 al 10],
  "feedback": "[tu retroalimentación educativa aquí]"
}`;

    return this.getFeedbackExerciseGeneric(prompt);
  }

  /**
   * Genera feedback para ejercicio de ordenar fragmentos de código
   * @param statement Enunciado del ejercicio
   * @param answerOrderFragmentCodeCorrect Orden correcto
   * @param answerOrderFragmentCodeUser Orden del usuario
   * @returns Feedback con calificación
   */
  async getFeedbackExerciseOrdenFragmentCode(
    statement: string,
    answerOrderFragmentCodeCorrect: string[],
    answerOrderFragmentCodeUser: string[],
  ): Promise<FeedbackExerciseDto> {
    const prompt = `Necesito que me des una retroalimentación educativa para un ejercicio de ordenar fragmentos de código.
      Esta es la Pregunta: ${statement}
      Este es el orden correcto: ${answerOrderFragmentCodeCorrect.join(' -> ')}
      El orden del usuario: ${answerOrderFragmentCodeUser.join(' -> ')}
      
      Por favor, proporciona una retroalimentación constructiva sobre el orden de los fragmentos de código.
      
      Responde en formato JSON con la siguiente estructura:
      {
        "qualification": [número del 0 al 10],
        "feedback": "[tu retroalimentación aquí]"
      }`;

    return this.getFeedbackExerciseGeneric(prompt);
  }

  /**
   * Genera feedback para ejercicio de ordenar líneas de código
   * @param statement Enunciado del ejercicio
   * @param answerOrderLineCode Orden correcto
   * @param answerOrderLineCodeUser Orden del usuario
   * @returns Feedback con calificación
   */
  async getFeedbackExerciseOrderLineCode(
    statement: string,
    answerOrderLineCode: string[],
    answerOrderLineCodeUser: string[],
  ): Promise<FeedbackExerciseDto> {
    const prompt = `Necesito que me des una retroalimentación educativa para un ejercicio de ordenar líneas de código.
      Esta es la Pregunta: ${statement}
      Este es el orden correcto: ${answerOrderLineCode.join('\n')}
      El orden del usuario: ${answerOrderLineCodeUser.join('\n')}
      
      Por favor, proporciona una retroalimentación constructiva sobre el orden de las líneas de código.
      
      Responde en formato JSON con la siguiente estructura:
      {
        "qualification": [número del 0 al 10],
        "feedback": "[tu retroalimentación aquí]"
      }`;

    return this.getFeedbackExerciseGeneric(prompt);
  }

  /**
   * Genera feedback para ejercicio de encontrar errores
   * @param statement Enunciado del ejercicio
   * @param correctAnswerFindError Respuesta correcta
   * @param userAnswerFindError Respuesta del usuario
   * @returns Feedback con calificación
   */
  async getFeedbackExerciseFindError(
    statement: string,
    correctAnswerFindError: string,
    userAnswerFindError: string,
  ): Promise<FeedbackExerciseDto> {
    const prompt = `Necesito que me des una retroalimentación educativa para un ejercicio de encontrar errores.
      Esta es la Pregunta: ${statement}
      La respuesta correcta: ${correctAnswerFindError}
      La respuesta del usuario: ${userAnswerFindError}
      
      Por favor, proporciona una retroalimentación constructiva sobre la identificación del error.
      
      Responde en formato JSON con la siguiente estructura:
      {
        "qualification": [número del 0 al 10],
        "feedback": "[tu retroalimentación aquí]"
      }`;

    return this.getFeedbackExerciseGeneric(prompt);
  }

  /**
   * Genera feedback para ejercicio de escribir código
   * @param statement Enunciado del ejercicio
   * @param answer Respuesta del usuario
   * @returns Feedback con calificación
   */
  async getFeedbackExerciseWriteCode(
    statement: string,
    answer: string,
  ): Promise<FeedbackExerciseDto> {
    const prompt = `Necesito que me des una retroalimentación educativa para un ejercicio de escribir código.
      Esta es la Pregunta: ${statement}
      La respuesta del usuario: ${answer}
      
      Por favor, evalúa el código del usuario considerando:
      - Correctitud sintáctica
      - Lógica de programación
      - Buenas prácticas
      - Cumplimiento del objetivo
      
      Proporciona una retroalimentación constructiva y educativa.
      
      Responde en formato JSON con la siguiente estructura:
      {
        "qualification": [número del 0 al 10],
        "feedback": "[tu retroalimentación aquí]"
      }`;

    return this.getFeedbackExerciseGeneric(prompt);
  }

  /**
   * Método genérico para generar feedback de ejercicios
   * @param prompt Prompt para la generación
   * @returns Feedback con calificación
   */
  private async getFeedbackExerciseGeneric(prompt: string): Promise<FeedbackExerciseDto> {
    try {
      const model = await this.ensureModel();
      const generationConfig = {
        temperature: 0.3, // Más determinística para respuestas consistentes
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 512, // Suficiente para feedback conciso
      };

      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });

      const response = result.response;
      const text = response.text();
      
      // Intentar extraer JSON de la respuesta
      try {
        // Buscar el JSON en el texto usando regex
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          const jsonResponse = JSON.parse(jsonString);
          
          return {
            qualification: Number(jsonResponse.qualification) || 0,
            feedback: jsonResponse.feedback || 'Retroalimentación no disponible',
          };
        } else {
          // Si no encuentra JSON, intentar parsear todo el texto
          const jsonResponse = JSON.parse(text);
          return {
            qualification: Number(jsonResponse.qualification) || 0,
            feedback: jsonResponse.feedback || text,
          };
        }
      } catch (parseError) {
        // Si no se puede parsear como JSON, extraer información manualmente
        console.warn('No se pudo parsear JSON de Gemini, usando texto completo:', text);
        
        // Intentar extraer calificación del texto si está presente
        const qualificationMatch = text.match(/(?:qualification|calificación|puntuación)[\s:]*(\d+(?:\.\d+)?)/i);
        const qualification = qualificationMatch ? Number(qualificationMatch[1]) : 5;
        
        return {
          qualification: Math.min(Math.max(qualification, 0), 10), // Asegurar que esté entre 0 y 10
          feedback: text.replace(/```json|```/g, '').trim(), // Limpiar markdown si existe
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error('Error al generar feedback con Gemini:', error);
      return {
        qualification: 0,
        feedback:
          'Error al generar retroalimentación. Por favor, inténtalo de nuevo.',
      };
    }
  }

  /**
   * Método público para generar contenido con Gemini
   * @param prompt Prompt para la generación
   * @returns Contenido generado
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      const model = await this.ensureModel();
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error('Error al generar contenido con Gemini:', error);
      throw new Error(`Error al generar contenido: ${errorMessage}`);
    }
  }
}
