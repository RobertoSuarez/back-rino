import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { ChaptersGPTService } from '../chapters/chaptersGPT.service';
import { GenerateExercisesService } from '../generate-exercises/generate-exercises.service';

@Injectable()
export class CourseAssistantService {
  private readonly logger = new Logger(CourseAssistantService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly generateExercisesService: GenerateExercisesService,
  ) {}

  /**
   * Sugiere títulos para un curso basado en una idea o nombre inicial.
   */
  async suggestCourseTitles(idea: string): Promise<string[]> {
    const prompt = `Actúa como un experto en diseño curricular y marketing educativo.
El usuario tiene una idea para un curso: "${idea}".

Tu tarea es:
1. Analizar la idea.
2. Sugerir 5 títulos creativos, impactantes y educativamente descriptivos para el curso.
3. El primer título debe ser una versión mejorada o refinada del nombre proporcionado.
4. Los otros 4 deben ser variaciones creativas (ej: uno más profesional, uno más lúdico/gamificado, uno enfocado a resultados).

Responde ÚNICAMENTE con una lista de 5 strings en formato JSON, sin explicaciones.
Ejemplo de salida: ["Título 1", "Título 2", "Título 3", "Título 4", "Título 5"]`;

    const response = await this.geminiService.generateContent(prompt);
    try {
      // Limpiar respuesta por si viene con markdown
      const cleanJson = response.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Error parsing suggested titles', error);
      return [idea]; // Fallback al original
    }
  }

  /**
   * Genera capítulos con una progresión lógica para un título de curso.
   */
  async generateChapters(courseTitle: string) {
    // Usamos el método existente en GeminiService
    const chapters = await this.geminiService.suggestChapters(courseTitle, []);
    return { chapters };
  }

  /**
   * Genera temas para un capítulo específico.
   */
  async generateTopics(courseTitle: string, chapterTitle: string) {
    const prompt = `Actúa como un diseñador instruccional. Para el capítulo "${chapterTitle}" del curso "${courseTitle}", genera una lista de 3 a 5 temas fundamentales.
Cada tema debe incluir:
- title: Título del tema.
- shortDescription: Una descripción muuuuy breve (máx 15 palabras).
- theory: Una explicación educativa inicial (1-2 párrafos) con emojis.
- difficulty: Fácil, Medio o Difícil.

Responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura:
{
  "temas": [
    { "title": "...", "shortDescription": "...", "theory": "...", "difficulty": "..." },
    ...
  ]
}`;

    const response = await this.geminiService.generateContent(prompt);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Error parsing suggested topics', error);
      return { temas: [] };
    }
  }

  /**
   * Genera un conjunto de ejercicios para un tema.
   */
  async generateExerciseSet(topicTitle: string, quantity: number, difficulty: string) {
    // Aquí podríamos crear un bucle para generar múltiples ejercicios usando GenerateExercisesService
    const exercises = [];
    for (let i = 0; i < quantity; i++) {
        const payload = {
            prompt: `Genera un ejercicio sobre el tema: ${topicTitle}. Dificultad: ${difficulty}.`,
            typeExercise: this.getRandomExerciseType(),
        };
        const exercise = await this.generateExercisesService.generateExercise(payload as any);
        exercises.push(exercise);
    }
    return exercises;
  }

  private getRandomExerciseType(): string {
    const types = ['selection_single', 'selection_multiple', 'order_fragment_code', 'order_line_code', 'find_error_code', 'match_pairs'];
    return types[Math.floor(Math.random() * types.length)];
  }
}
