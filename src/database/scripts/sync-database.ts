import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

/**
 * Script para sincronizar manualmente la base de datos con las entidades
 * Útil para entornos de producción donde synchronize: true no es recomendable
 * 
 * Uso: npx ts-node -r tsconfig-paths/register src/database/scripts/sync-database.ts
 */
async function syncDatabase() {
  const logger = new Logger('DatabaseSync');
  logger.log('Iniciando sincronización de la base de datos...');

  try {
    // Inicializar la aplicación NestJS para cargar todas las configuraciones
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Obtener la conexión de TypeORM
    const dataSource = app.get(DataSource);
    
    // Sincronizar el esquema (esto es equivalente a synchronize: true)
    await dataSource.synchronize(false); // false para no eliminar tablas existentes
    
    logger.log('Sincronización completada exitosamente');
    
    // Cerrar la aplicación
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Error durante la sincronización: ${error.message}`);
    process.exit(1);
  }
}

syncDatabase();
