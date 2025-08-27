import { Module } from '@nestjs/common';
import { ClassesController } from './controllers/classes/classes.controller';
import { ClassesService } from './services/classes/classes.service';
import { Classes } from '../database/entities/classes.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Matricula } from '../database/entities/matricula.entity';
import { AssessmentController } from './controllers/assessment/assessment.controller';
import { AssessmentService } from './services/assessment/assessment.service';
import { Assessment } from '../database/entities/assessment.entity';
import { QuestionOfAssessmentController } from './controllers/question-of-assessment/question-of-assessment.controller';
import { QuestionOfAssessmentService } from './services/question-of-assessment/question-of-assessment.service';
import { QuestionOfAssessment } from '../database/entities/questionOfAssessment.entity';
import { AssessmentOfUser } from '../database/entities/assessmentOfUser.entity';
import { QuestionOfUser } from '../database/entities/questionOfUser.entity';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Classes,
      User,
      Matricula,
      Assessment,
      QuestionOfAssessment,
      AssessmentOfUser,
      QuestionOfUser,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES') },
      }),
    }),
    OpenaiModule,
  ],
  controllers: [
    ClassesController,
    AssessmentController,
    QuestionOfAssessmentController,
  ],
  providers: [ClassesService, AssessmentService, QuestionOfAssessmentService],
})
export class ClassesModule {}
