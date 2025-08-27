import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => {
        return {
          type: 'postgres',
          host: ConfigService.get('DATABASE_HOST'),
          port: ConfigService.get('DATABASE_PORT'),
          username: ConfigService.get('DATABASE_USER'),
          password: ConfigService.get('DATABASE_PASSWORD'),
          database: ConfigService.get('DATABASE_NAME'),
          entities: [
            __dirname + '/entities/*.entity{.ts,.js}',
            __dirname + '/../**/*.entity{.ts,.js}'
          ],
          synchronize: ConfigService.get('NODE_ENV') !== 'production', // true en desarrollo, false en producción
          ssl: true,
          logging: ConfigService.get('NODE_ENV') !== 'production', // Activar logs en desarrollo
          autoLoadEntities: true, // Cargar automáticamente las entidades registradas en los módulos
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
