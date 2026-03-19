import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Cyber Imperium API')
    .setDescription('La documentación de la API de Cyber Imperium')
    .setVersion('1.0')
    .addTag('Cyber Imperium')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.enableCors();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
