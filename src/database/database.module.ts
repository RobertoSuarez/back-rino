import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => {
        const sslEnv = ConfigService.get<string>('DATABASE_SSL');
        const isProd = ConfigService.get('NODE_ENV') === 'production';
        const sslOption = typeof sslEnv === 'string' ? sslEnv === 'true' : isProd;
        console.log('ssl Option: ', sslOption);
        var config: TypeOrmModuleOptions = {
          type: 'postgres',
          host: ConfigService.get('DATABASE_HOST'),
          port: Number(ConfigService.get('DATABASE_PORT')),
          username: ConfigService.get('DATABASE_USER'),
          password: ConfigService.get('DATABASE_PASSWORD'),
          database: ConfigService.get('DATABASE_NAME'),
          entities: [
           __dirname + '/entities/*.entity{.ts,.js}',
          ],
          synchronize: true, // true en desarrollo, false en producción
          ssl: sslOption,
          logging: ConfigService.get('NODE_ENV') !== 'production', // Activar logs en desarrollo
          autoLoadEntities: true, // Cargar automáticamente las entidades registradas en los módulos
        };
        console.log('Config: ', config);
        return  config;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
