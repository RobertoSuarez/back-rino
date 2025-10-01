import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { ChatgptModule } from './chatgpt/chatgpt.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ParametersModule } from './parameters/parameters.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/response.interceptor';
import { AllExceptionsFilter } from './common/exception.filter';
import { OpenaiModule } from './openai/openai.module';
import { ClassesModule } from './classes/classes.module';
import { CommunityModule } from './community/community.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { LearningPathModule } from './learning-path/learning-path.module';
import { TeacherModule } from './teacher/teacher.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UserModule,
    CourseModule,
    ChatgptModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env'],
      isGlobal: true,
    }),
    DatabaseModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const user = configService.get('MAIL_USER');
        const pass = configService.get('MAIL_PASS');

        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // false para puerto 587 con STARTTLS
            requireTLS: true, // Requiere STARTTLS
            auth: {
              user,
              pass,
            },
            tls: {
              rejectUnauthorized: false, // Permite certificados autofirmados en desarrollo
            },
          },
          defaults: {
            from: '"Cyber Imperium" <cyberimperiumapp@gmail.com>',
          },
        };
      },
    }),
    ParametersModule,
    OpenaiModule,
    ClassesModule,
    CommunityModule,
    StatisticsModule,
    LearningPathModule,
    TeacherModule,
    AdminModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
