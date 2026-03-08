import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth & Users Controller (e2e)', () => {
    let app: INestApplication;

    // Variables for the testing
    let userToken: string;
    let userId: number;
    const testEmail = `test_e2e_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // Global timeout for the DB connections
    jest.setTimeout(30000);

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
    });

    afterAll(async () => {
        // Attempt to clean up the created user using the internal service or repository
        try {
            if (userId) {
                // We do it via the internal UsersService to bypass roles/guards
                const { UsersService } = await import('../src/user/services/users/users.service');
                const usersService = app.get(UsersService);
                await usersService.deleteUser(userId);
                console.log(`Cleaned up test user: ${userId}`);
            }
        } catch (e) {
            console.warn('Could not clean up test user automatically:', e);
        }

        await app.close();
    });

    it('/users (POST) - Register a new user', async () => {
        const payload = {
            firstName: 'E2E Test',
            lastName: 'User',
            password: testPassword,
            email: testEmail,
            birthday: '1990-01-01',
            typeUser: 'student'
        };

        const response = await request(app.getHttpServer())
            .post('/users')
            .send(payload)
            .expect(201); // Created

        expect(response.body.message).toBe('Usuario creado correctamente');
        expect(response.body.data).toBeDefined();

        // Save the ID for cleanup
        userId = response.body.data.id;
    });

    it('/auth/login (POST) - Login with the new user', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: testEmail, password: testPassword });

        if (response.status !== 201 && response.status !== 200) {
            console.error('Login failed with body:', response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testEmail);

        // Save token for next tests
        userToken = response.body.accessToken;
    });

    it('/auth/profile (GET) - Access protected route without token', async () => {
        await request(app.getHttpServer())
            .get('/auth/profile')
            .expect(401); // Unauthorized
    });

    it('/auth/profile (GET) - Access protected route with token', async () => {
        const response = await request(app.getHttpServer())
            .get('/auth/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        // The return of getProfile might have id inside user object or top level depending on UsersService.getProfile
        // Let's just expect it succeeds and email matches
        expect(response.body.email).toBe(testEmail);
    });
});
