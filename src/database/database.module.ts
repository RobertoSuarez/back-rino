import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const sslEnv = configService.get<string>('DATABASE_SSL');
        const isProd = configService.get('NODE_ENV') === 'production';
        const sslOption = typeof sslEnv === 'string' ? sslEnv === 'true' : isProd;
        
        // Obtener la ruta del certificado CA desde variables de entorno
        const caCertPath = configService.get<string>('DATABASE_CA_CERT_PATH');
        const caCertContent = configService.get<string>('DATABASE_CA_CERT');
        
        // Configuración SSL
        let sslConfig: any = sslOption;
        
        // Si se requiere SSL con configuración específica
        if (sslOption) {
          sslConfig = {
            rejectUnauthorized: configService.get<string>('DATABASE_REJECT_UNAUTHORIZED') !== 'false',
          };
          
          // Si hay contenido del certificado directamente en las variables de entorno
          if (caCertContent) {
            sslConfig.ca = caCertContent;
          } 
          // Si hay una ruta al archivo del certificado
          else if (caCertPath && fs.existsSync(caCertPath)) {
            sslConfig.ca = fs.readFileSync(caCertPath).toString();
          }
        }
        
        
        const config: TypeOrmModuleOptions = {
          type: 'postgres',
          host: configService.get('DATABASE_HOST'),
          port: Number(configService.get('DATABASE_PORT')),
          username: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          entities: [
            __dirname + '/entities/*.entity{.ts,.js}',
          ],
          synchronize: configService.get<string>('DATABASE_SYNCHRONIZE') === 'true', // true en desarrollo, false en producción
          ssl: sslConfig,
          logging: configService.get<string>('DATABASE_LOGGING') === 'true', // Activar logs en desarrollo
          autoLoadEntities: true, // Cargar automáticamente las entidades registradas en los módulos
        };
        
        // Ocultar la contraseña en los logs
        const logConfig = {...config};
        if (logConfig.password) {
          logConfig.password = '********';
        }
        
        return config;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
