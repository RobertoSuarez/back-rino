import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

/**
 * Script para verificar la sincronización entre entidades y tablas de la base de datos
 * 
 * Uso: npx ts-node -r tsconfig-paths/register src/database/scripts/check-sync.ts
 */
async function checkSync() {
  const logger = new Logger('SyncCheck');
  logger.log('Verificando sincronización entre entidades y tablas...');

  try {
    // Inicializar la aplicación NestJS para cargar todas las configuraciones
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Obtener la conexión de TypeORM
    const dataSource = app.get(DataSource);
    
    // Obtener todas las entidades registradas
    const entities = dataSource.entityMetadatas;
    logger.log(`Entidades registradas: ${entities.length}`);
    
    // Verificar cada entidad
    for (const entity of entities) {
      try {
        // Consultar si la tabla existe
        const tableExists = await dataSource.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${entity.tableName}'
          );`
        );
        
        const exists = tableExists[0].exists === 'true' || tableExists[0].exists === true;
        
        if (exists) {
          // Obtener columnas de la tabla
          const tableColumns = await dataSource.query(
            `SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = '${entity.tableName}';`
          );
          
          // Comparar columnas de la entidad con columnas de la tabla
          const entityColumns = entity.columns.map(col => col.databaseName);
          const dbColumns = tableColumns.map(col => col.column_name);
          
          const missingInDb = entityColumns.filter(col => !dbColumns.includes(col));
          const extraInDb = dbColumns.filter(col => !entityColumns.includes(col));
          
          if (missingInDb.length > 0 || extraInDb.length > 0) {
            logger.warn(`Discrepancia en tabla ${entity.tableName}:`);
            if (missingInDb.length > 0) {
              logger.warn(`  - Columnas en entidad pero no en BD: ${missingInDb.join(', ')}`);
            }
            if (extraInDb.length > 0) {
              logger.warn(`  - Columnas en BD pero no en entidad: ${extraInDb.join(', ')}`);
            }
          } else {
            logger.log(`✓ Tabla ${entity.tableName} está sincronizada correctamente`);
          }
        } else {
          logger.warn(`✗ Tabla ${entity.tableName} no existe en la base de datos`);
        }
      } catch (error) {
        logger.error(`Error verificando entidad ${entity.name}: ${error.message}`);
      }
    }
    
    logger.log('Verificación completada');
    
    // Cerrar la aplicación
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Error durante la verificación: ${error.message}`);
    process.exit(1);
  }
}

checkSync();
