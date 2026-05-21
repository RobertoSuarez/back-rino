import { BaseTable } from '../../common/entities/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LearningPathSubscription } from './learningPathSubscription.entity';
import { User } from './user.entity';

/**
 * Almacena la calificación final de un estudiante en una ruta de aprendizaje.
 * - suggestedGrade: calculado automáticamente del progreso en actividades (0–10)
 * - finalGrade: ingresada/ajustada manualmente por el docente (0–10)
 */
@Entity()
export class LearningPathGrade extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  /** Relación al par (estudiante, ruta) — ya garantiza unicidad */
  @ManyToOne(() => LearningPathSubscription, { eager: false, nullable: false })
  subscription: LearningPathSubscription;

  /** Nota calculada: AVG(mejor accuracy por actividad) / 10 */
  @Column({ type: 'float', nullable: true })
  suggestedGrade: number;

  /** Nota final ajustada por el profesor */
  @Column({ type: 'float', nullable: true })
  finalGrade: number;

  /** Comentario del docente */
  @Column({ type: 'text', nullable: true })
  observations: string;

  /** Fecha en que se guardó la nota final */
  @Column({ type: 'timestamptz', nullable: true })
  gradedAt: Date;

  /** Profesor que calificó */
  @ManyToOne(() => User, { eager: false, nullable: true })
  gradedBy: User;
}
