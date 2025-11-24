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

  // Palabras clave que indican contenido inapropiado
  private readonly inappropriateKeywords = [
    // Violencia
    'asesinar', 'matar', 'golpear', 'herir', 'atacar', 'violencia', 'pelear',
    // Contenido sexual
    'pichola', 'pene', 'verga', 'polla', 'sexo', 'pornografía', 'desnudo', 'sexual',
    // Acoso y abuso
    'violar', 'abusar', 'acoso', 'hostigar', 'intimidar', 'amenaza',
    // Drogas y sustancias
    'droga', 'cocaína', 'heroína', 'marihuana', 'meth', 'fentanilo',
    // Otros inapropiados
    'suicidio', 'muerte', 'bomba', 'arma', 'explosivo', 'terrorismo',
  ];

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
   * Valida si el contenido contiene palabras o temas inapropiados
   * @param content Contenido a validar
   * @returns true si el contenido es inapropiado, false si es apropiado
   */
  private isInappropriateContent(content: string): boolean {
    if (!content) return false;
    
    const lowerContent = content.toLowerCase();
    
    // Verificar palabras clave inapropiadas
    for (const keyword of this.inappropriateKeywords) {
      if (lowerContent.includes(keyword)) {
        this.logger.warn(`Contenido inapropiado detectado: "${keyword}"`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Genera una descripción para un curso basado en su título
   * @param title Título del curso
   * @returns Descripción generada
   */
  async generateCourseDescription(title: string): Promise<string> {
    // Validar contenido del título
    if (this.isInappropriateContent(title)) {
      throw new Error('No es posible generar contenido con ese título. Por favor, utiliza un título apropiado para un curso de ciberseguridad.');
    }
    const prompt = `Eres un experto en educación de ciberseguridad para niños y adolescentes. 
Genera una descripción detallada y atractiva para un curso de ciberseguridad titulado "${title}" en la plataforma Cyber Imperium.

INSTRUCCIONES:
1. La descripción debe ser un párrafo único y cautivador
2. Destaca los beneficios prácticos del curso para protegerse en línea
3. Menciona que los estudiantes aprenderán sobre seguridad digital y protección personal
4. Usa un tono amigable, motivador y accesible para estudiantes de 12-14 años
5. Incluye referencias a conceptos de seguridad como protección, privacidad, conciencia digital
6. NO menciones explícitamente la edad ni el nivel educativo
7. Haz que suene emocionante y relevante para su vida digital
8. Máximo 150 palabras`;

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
    const prompt = `Eres un educador de ciberseguridad creativo para estudiantes de 12-14 años.
Genera una descripción concisa y clara para un capítulo titulado "${chapterTitle}" 
que forma parte del curso de ciberseguridad "${courseTitle}" en Cyber Imperium.

Contexto del curso: "${courseDescription}"

INSTRUCCIONES:
1. La descripción debe tener entre 80 y 120 palabras
2. Explica qué temas de ciberseguridad se cubrirán en este capítulo
3. Destaca por qué es importante para su seguridad digital
4. Usa un tono motivador y accesible
5. Incluye emojis relevantes (🔐, ⚠️, 🛡️, etc.) para hacerlo atractivo
6. Muestra cómo se relaciona con el objetivo general del curso`;

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
    const shortDescPrompt = `Eres un educador de ciberseguridad para niños de 12-14 años.
Genera una descripción breve (máximo 50 palabras) para un tema de ciberseguridad titulado "${temaTitle}" 
que forma parte del capítulo "${chapterTitle}" en el curso "${courseTitle}" de Cyber Imperium.

La descripción debe:
- Ser clara y atractiva
- Explicar por qué es importante para su seguridad digital
- Incluir un emoji relevante`;
    
    const shortDescription = await this.generateContent(shortDescPrompt);

    // Generar teoría completa
    const theoryPrompt = `Eres un profesor de ciberseguridad entusiasta que crea contenido educativo para estudiantes de 12-14 años.
Genera contenido educativo completo y detallado para un tema titulado "${temaTitle}" 
que forma parte del capítulo "${chapterTitle}" en el curso "${courseTitle}" de Cyber Imperium.

El contenido debe incluir:
1. Una introducción cautivadora al tema
2. Desarrollo de los conceptos principales de seguridad digital
3. Ejemplos prácticos y relevantes para su vida digital
4. Consejos de protección y buenas prácticas
5. Conclusión con un resumen de lo aprendido

INSTRUCCIONES IMPORTANTES:
- Usa un tono amigable y motivador
- Incluye emojis relevantes (🔐, ⚠️, 🛡️, ✅, 🎯, etc.)
- Destaca la importancia de la seguridad en línea
- Proporciona ejemplos del mundo real que los adolescentes puedan entender
- Estructura el contenido de forma clara y fácil de seguir
- Extensión aproximada: 500-800 palabras`;
    
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
    // Validar contenido del prompt personalizado
    if (this.isInappropriateContent(prompt)) {
      throw new Error('❌ No es posible generar contenido con esa solicitud. Por favor, utiliza un prompt apropiado relacionado con ciberseguridad y seguridad digital. Recuerda que Cyber Imperium es una plataforma educativa para estudiantes de 12-14 años.');
    }

    const theoryPrompt = `Eres Amauta, un profesor de ciberseguridad creativo y entusiasta que crea contenido educativo para estudiantes de 12-14 años en Cyber Imperium.
Te inspiras en la sabiduría de los chasquis incas, los mensajeros que transmitían información de forma segura en el imperio inca.
Ahora ayudas a los estudiantes a ser "chasquis digitales" - mensajeros seguros en el mundo digital.

CONTEXTO:
- Tema: ${temaTitle}
- Capítulo: ${chapterTitle}
- Curso: ${courseTitle}
- Plataforma: Cyber Imperium

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
   - Usa emojis para ilustrar ideas (🔒 para seguridad, ⚠️ para advertencias, ✅ para consejos, 🎯 para objetivos, 🛡️ para protección, etc.)
4. Mantén un tono amigable, motivador y culturalmente respetuoso
5. Incluye ejemplos prácticos y relevantes para su vida digital
6. Cuando sea apropiado, usa la metáfora de los chasquis incas como guardianes de la información segura
7. Termina con un resumen o conclusión que refuerce la importancia de la seguridad digital
8. Extensión: 600-1000 palabras
9. Asegúrate de que sea educativo pero entretenido

IMPORTANTE: Responde ÚNICAMENTE con el HTML del contenido, sin explicaciones adicionales.`;

    return await this.generateContent(theoryPrompt);
  }

  /**
   * Genera una descripción para un curso con un prompt personalizado
   * @param courseTitle Título del curso
   * @param prompt Prompt personalizado del usuario
   * @returns Descripción generada
   */
  async generateCourseDescriptionWithPrompt(
    courseTitle: string,
    prompt: string,
  ): Promise<string> {
    // Validar contenido del prompt personalizado
    if (this.isInappropriateContent(prompt)) {
      throw new Error('❌ No es posible generar contenido con esa solicitud. Por favor, utiliza un prompt apropiado relacionado con ciberseguridad y seguridad digital. Recuerda que Cyber Imperium es una plataforma educativa para estudiantes de 12-14 años.');
    }

    const descriptionPrompt = `Eres Amauta, un profesor de ciberseguridad creativo que crea descripciones atractivas para cursos en Cyber Imperium.
Te inspiras en la sabiduría de los chasquis incas, los mensajeros que transmitían información de forma segura.

CONTEXTO:
- Título del Curso: ${courseTitle}
- Plataforma: Cyber Imperium
- Audiencia: Estudiantes de 12-14 años

SOLICITUD DEL USUARIO:
${prompt}

INSTRUCCIONES IMPORTANTES:
1. Genera una descripción detallada y cautivadora para el curso
2. La descripción debe ser un párrafo único o varios párrafos bien estructurados
3. Destaca los beneficios prácticos del curso para protegerse en línea
4. Menciona que los estudiantes aprenderán sobre seguridad digital y protección personal
5. Usa un tono amigable, motivador y accesible para estudiantes de 12-14 años
6. Incluye referencias a conceptos de seguridad como protección, privacidad, conciencia digital
7. Haz que suene emocionante y relevante para su vida digital
8. Puedes incluir emojis relevantes (🔐, 🛡️, ⚠️, ✅, etc.)
9. Extensión aproximada: 150-250 palabras
10. Asegúrate de que sea educativo pero entretenido

IMPORTANTE: Responde ÚNICAMENTE con la descripción del curso, sin explicaciones adicionales.`;

    return await this.generateContent(descriptionPrompt);
  }

  /**
   * Genera una descripción para un capítulo con un prompt personalizado
   * @param chapterTitle Título del capítulo
   * @param courseTitle Título del curso
   * @param courseDescription Descripción del curso
   * @param prompt Prompt personalizado del usuario
   * @returns Descripción generada
   */
  async generateChapterDescriptionWithPrompt(
    chapterTitle: string,
    courseTitle: string,
    courseDescription: string,
    prompt: string,
  ): Promise<string> {
    // Validar contenido del prompt personalizado
    if (this.isInappropriateContent(prompt)) {
      throw new Error('❌ No es posible generar contenido con esa solicitud. Por favor, utiliza un prompt apropiado relacionado con ciberseguridad y seguridad digital. Recuerda que Cyber Imperium es una plataforma educativa para estudiantes de 12-14 años.');
    }

    const descriptionPrompt = `Eres Amauta, un profesor de ciberseguridad creativo que crea descripciones atractivas para capítulos en Cyber Imperium.
Te inspiras en la sabiduría de los chasquis incas, los mensajeros que transmitían información de forma segura.

CONTEXTO:
- Título del Capítulo: ${chapterTitle}
- Título del Curso: ${courseTitle}
- Descripción del Curso: ${courseDescription}
- Plataforma: Cyber Imperium
- Audiencia: Estudiantes de 12-14 años

SOLICITUD DEL USUARIO:
${prompt}

INSTRUCCIONES IMPORTANTES:
1. Genera una descripción concisa y clara para el capítulo
2. La descripción debe tener entre 80 y 150 palabras
3. Explica qué temas de ciberseguridad se cubrirán en este capítulo
4. Destaca por qué es importante para su seguridad digital
5. Usa un tono motivador y accesible
6. Incluye emojis relevantes (🔐, ⚠️, 🛡️, ✅, 🎯, etc.) para hacerlo atractivo
7. Muestra cómo se relaciona con el objetivo general del curso
8. Haz que suene emocionante y relevante para su vida digital
9. Asegúrate de que sea educativo pero entretenido

IMPORTANTE: Responde ÚNICAMENTE con la descripción del capítulo, sin explicaciones adicionales.`;

    return await this.generateContent(descriptionPrompt);
  }

  /**
   * Genera una descripción corta para un tema con un prompt personalizado
   * @param temaTitle Título del tema
   * @param chapterTitle Título del capítulo
   * @param courseTitle Título del curso
   * @param prompt Prompt personalizado del usuario
   * @returns Descripción generada
   */
  async generateTemaDescriptionWithPrompt(
    temaTitle: string,
    chapterTitle: string,
    courseTitle: string,
    prompt: string,
  ): Promise<string> {
    // Validar contenido del prompt personalizado
    if (this.isInappropriateContent(prompt)) {
      throw new Error('❌ No es posible generar contenido con esa solicitud. Por favor, utiliza un prompt apropiado relacionado con ciberseguridad y seguridad digital. Recuerda que Cyber Imperium es una plataforma educativa para estudiantes de 12-14 años.');
    }

    const descriptionPrompt = `Eres Amauta, un profesor de ciberseguridad creativo que crea descripciones cortas atractivas para temas en Cyber Imperium.
Te inspiras en la sabiduría de los chasquis incas, los mensajeros que transmitían información de forma segura.

CONTEXTO:
- Título del Tema: ${temaTitle}
- Título del Capítulo: ${chapterTitle}
- Título del Curso: ${courseTitle}
- Plataforma: Cyber Imperium
- Audiencia: Estudiantes de 12-14 años

SOLICITUD DEL USUARIO:
${prompt}

INSTRUCCIONES IMPORTANTES:
1. Genera una descripción corta y clara para el tema
2. La descripción debe tener entre 50 y 100 palabras
3. Explica brevemente qué se aprenderá en este tema
4. Destaca por qué es importante para su seguridad digital
5. Usa un tono motivador y accesible
6. Incluye emojis relevantes (🔐, ⚠️, 🛡️, ✅, 🎯, etc.) para hacerlo atractivo
7. Haz que suene emocionante y relevante para su vida digital
8. Asegúrate de que sea educativo pero entretenido

IMPORTANTE: Responde ÚNICAMENTE con la descripción del tema, sin explicaciones adicionales.`;

    return await this.generateContent(descriptionPrompt);
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
    const prompt = `Eres Amauta, un profesor de ciberseguridad que proporciona retroalimentación educativa a estudiantes de 12-14 años en Cyber Imperium.
Evalúa la respuesta del usuario sobre ciberseguridad y proporciona retroalimentación constructiva.

PREGUNTA DE CIBERSEGURIDAD: ${statement}
RESPUESTA CORRECTA: ${answerSelectCorrect}
RESPUESTA DEL USUARIO: ${answerSelect}

INSTRUCCIONES:
- Si la respuesta es correcta, felicita al usuario y explica por qué es importante este conocimiento para su seguridad digital
- Si es incorrecta, explica por qué de forma amigable y proporciona la información correcta
- Sé constructivo, educativo y motivador
- Usa emojis relevantes en la retroalimentación
- Destaca la importancia de este concepto para protegerse en línea

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
    const prompt = `Eres Amauta, un profesor de ciberseguridad que proporciona retroalimentación educativa a estudiantes de 12-14 años en Cyber Imperium.
Evalúa la respuesta del usuario en un ejercicio de selección múltiple sobre ciberseguridad.

PREGUNTA DE CIBERSEGURIDAD: ${statement}
RESPUESTA CORRECTAS: ${answerSelectsCorrect.join(', ')}
RESPUESTA DEL USUARIO: ${answerSelect.join(', ')}

INSTRUCCIONES:
- Menciona qué opciones seleccionó correctamente y cuáles no
- Explica por qué cada opción es correcta o incorrecta en el contexto de ciberseguridad
- Proporciona retroalimentación constructiva, educativa y motivadora
- Destaca la importancia de cada concepto para su seguridad digital
- Usa emojis relevantes

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
    const prompt = `Eres Amauta, un profesor de ciberseguridad que proporciona retroalimentación educativa a estudiantes de 12-14 años en Cyber Imperium.
Proporciona retroalimentación educativa para un ejercicio de ordenar fragmentos de código de seguridad.

PREGUNTA: ${statement}
ORDEN CORRECTO: ${answerOrderFragmentCodeCorrect.join(' -> ')}
ORDEN DEL USUARIO: ${answerOrderFragmentCodeUser.join(' -> ')}

INSTRUCCIONES:
- Proporciona una retroalimentación constructiva sobre el orden de los fragmentos
- Explica por qué el orden correcto es importante para la seguridad
- Si hay errores, ayuda al estudiante a entender la lógica correcta
- Sé motivador y educativo
- Usa emojis relevantes

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
    const prompt = `Eres Amauta, un profesor de ciberseguridad que proporciona retroalimentación educativa a estudiantes de 12-14 años en Cyber Imperium.
Proporciona retroalimentación educativa para un ejercicio de ordenar líneas de código de seguridad.

PREGUNTA: ${statement}
ORDEN CORRECTO: ${answerOrderLineCode.join('\n')}
ORDEN DEL USUARIO: ${answerOrderLineCodeUser.join('\n')}

INSTRUCCIONES:
- Proporciona una retroalimentación constructiva sobre el orden de las líneas
- Explica por qué el orden correcto es importante para la seguridad
- Si hay errores, ayuda al estudiante a entender la lógica correcta
- Sé motivador y educativo
- Usa emojis relevantes

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
    const prompt = `Eres Amauta, un profesor de ciberseguridad que proporciona retroalimentación educativa a estudiantes de 12-14 años en Cyber Imperium.
Proporciona retroalimentación educativa para un ejercicio de encontrar errores de seguridad.

PREGUNTA: ${statement}
RESPUESTA CORRECTA: ${correctAnswerFindError}
RESPUESTA DEL USUARIO: ${userAnswerFindError}

INSTRUCCIONES:
- Proporciona una retroalimentación constructiva sobre la identificación del error
- Explica por qué es importante detectar este tipo de errores de seguridad
- Si el estudiante no identificó el error correctamente, ayúdale a entender dónde está
- Destaca las consecuencias de no detectar este tipo de errores
- Sé motivador y educativo
- Usa emojis relevantes

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
    const prompt = `Eres Amauta, un profesor de ciberseguridad que proporciona retroalimentación educativa a estudiantes de 12-14 años en Cyber Imperium.
Proporciona retroalimentación educativa para un ejercicio de escribir código de seguridad.

PREGUNTA: ${statement}
RESPUESTA DEL USUARIO: ${answer}

Por favor, evalúa el código del usuario considerando:
- Correctitud sintáctica
- Lógica de seguridad
- Buenas prácticas de ciberseguridad
- Cumplimiento del objetivo de seguridad
- Importancia para proteger sistemas y datos

Proporciona una retroalimentación constructiva, educativa y motivadora.
Usa emojis relevantes para hacerlo más atractivo.
Destaca por qué el código correcto es importante para la seguridad.

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
