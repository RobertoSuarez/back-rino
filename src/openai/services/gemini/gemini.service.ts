import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private generativeAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY no está configurada en las variables de entorno');
    }
    
    this.generativeAI = new GoogleGenerativeAI(apiKey);
    this.model = this.generativeAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' });
  }

  /**
   * Genera una descripción para un curso basado en su título
   * @param title Título del curso
   * @returns Descripción generada
   */
  async generateCourseDescription(title: string): Promise<string> {
    const prompt = `Genera una descripción detallada y atractiva para un curso educativo titulado "${title}". 
    La descripción debe tener entre 150 y 200 palabras, destacar los beneficios del curso, 
    a quién va dirigido y qué aprenderán los estudiantes. Usa un tono profesional pero amigable.`;

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
   * Método genérico para generar contenido con Gemini
   * @param prompt Prompt para la generación
   * @returns Contenido generado
   */
  private async generateContent(prompt: string): Promise<string> {
    try {
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

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error al generar contenido con Gemini:', error);
      throw new Error(`Error al generar contenido: ${error.message}`);
    }
  }
}
