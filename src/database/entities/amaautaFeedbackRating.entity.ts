import { BaseTable } from '../../common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class AmaautaFeedbackRating extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.amaautaFeedbackRatings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'int' })
  rating: number; // Escala 1-5

  @Column({ type: 'text', nullable: true })
  feedback: string; // Retroalimentación de IA que fue calificada

  @Column({ type: 'text', nullable: true })
  userAnswer: string; // Respuesta del usuario

  @Column({ type: 'text', nullable: true })
  comment: string; // Comentario opcional del usuario

  @Column({ type: 'varchar', length: 50, nullable: true })
  exerciseType: string; // Tipo de ejercicio

  @Column({ nullable: true })
  exerciseId: number; // ID del ejercicio (si aplica)

  @Column({ type: 'varchar', length: 50, nullable: true })
  activityName: string; // Nombre de la actividad

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  exerciseQualification: number; // Calificación del ejercicio (0-10)
}
