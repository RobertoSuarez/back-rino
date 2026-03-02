import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('OpenAI Exercises Controller (e2e)', () => {
    let app: INestApplication;

    // Aumentamos globalmente el timeout para este suite porque Gemini es lento
    jest.setTimeout(60000);

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/openai/exercises/generate (POST)', async () => {
        const payload = {
            prompt: 'Genera un ejercicio muy simple sobre suma de 2 mas 2',
            typeExercise: 'selection_single'
        };

        const response = await request(app.getHttpServer())
            .post('/openai/exercises/generate')
            .send(payload)
            .expect(201); // O 200 dependiendo de cómo NestJS configure el @Post

        expect(response.body).toBeDefined();
    });

    it('/openai/exercises/generate-with-prompt (POST) - Error por validation', async () => {
        // Probamos el ValidationPipe
        const payload = {
            prompt: 'Genera algo',
            difficulty: 'Invalida', // Deberia ser 'Fácil', 'Medio', 'Difícil'
            quantity: 11 // Deberia ser max 10
        };

        const response = await request(app.getHttpServer())
            .post('/openai/exercises/generate-with-prompt')
            .send(payload)
            .expect(400);

        expect(response.body.message).toBeDefined();
        expect(response.body.message).toBeInstanceOf(Array);
    });
});
