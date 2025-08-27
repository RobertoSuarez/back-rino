import { BaseTable } from '../../common/entities/base.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './activity.entity';

@Entity()
export class Exercise extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  // Varios ejercicios se relaciona con un tema.
  @ManyToOne(() => Activity, (a) => a.exercises)
  activity: Activity;

  @Column({ default: 'Fácil' })
  difficulty: string;

  @Column()
  statement: string;

  @Column({ default: '' })
  code: string;

  @Column()
  hind: string;

  @Column({
    enum: [
      'selection_single',
      'selection_multiple',
      'order_fragment_code',
      'order_line_code',
      'write_code',
      'find_error_code',
    ],
    default: 'selection_single',
  })
  typeExercise:
    | 'selection_single'
    | 'selection_multiple'
    | 'order_fragment_code' // VARIAS LINEAS
    | 'order_line_code' // DE SOLO UNA LINEA
    | 'write_code'
    | 'find_error_code';

  // Opciones para las diferentes preguntas.

  @Column({ type: 'json', default: [] })
  optionSelectOptions: string[];

  @Column({ type: 'json', default: [] })
  optionOrderFragmentCode: string[];

  @Column({ type: 'json', default: [] })
  optionOrderLineCode: string[];

  @Column({ type: 'json', default: [] })
  optionsFindErrorCode: string[];

  // Respuestas de las diferentes preguntas.
  @Column()
  answerSelectCorrect: string;

  @Column({ type: 'json', default: [] })
  answerSelectsCorrect: string[];

  @Column({ type: 'json', default: [] })
  answerOrderFragmentCode: string[];

  @Column({ type: 'json', default: [] })
  answerOrderLineCode: string[];

  @Column({ default: '' })
  answerFindError: string;
}
