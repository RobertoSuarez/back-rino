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
      'vertical_ordering',
      'horizontal_ordering',
      'phishing_selection_multiple',
      'match_pairs'
    ],
    default: 'selection_single',
  })
  typeExercise:
    | 'selection_single'
    | 'selection_multiple'
    | 'order_fragment_code' // VARIAS LINEAS
    | 'order_line_code' // DE SOLO UNA LINEA
    | 'write_code'
    | 'find_error_code'
    | 'vertical_ordering'
    | 'horizontal_ordering'
    | 'phishing_selection_multiple'
    | 'match_pairs';

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

  @Column({ default: '' })
  answerWriteCode: string;

  // Opciones y respuestas para vertical_ordering
  @Column({ type: 'json', default: [] })
  optionsVerticalOrdering: string[];

  @Column({ type: 'json', default: [] })
  answerVerticalOrdering: string[];

  // Opciones y respuestas para horizontal_ordering
  @Column({ type: 'json', default: [] })
  optionsHorizontalOrdering: string[];

  @Column({ type: 'json', default: [] })
  answerHorizontalOrdering: string[];

  // Opciones y respuestas para phishing_selection_multiple
  @Column({ type: 'json', default: [] })
  optionsPhishingSelection: string[];

  @Column({ type: 'json', default: [] })
  answerPhishingSelection: string[];

  @Column({ default: '', nullable: true })
  phishingContext: string; // Contexto adicional como URL, email, o descripción del escenario

  @Column({ default: '', nullable: true })
  phishingImageUrl: string; // URL de imagen para mostrar (ej: captura de email phishing)

  // Opciones y respuestas para match_pairs
  @Column({ type: 'json', default: [] })
  optionsMatchPairsLeft: string[]; // Lista de elementos del lado izquierdo

  @Column({ type: 'json', default: [] })
  optionsMatchPairsRight: string[]; // Lista de elementos del lado derecho

  @Column({ type: 'json', default: [] })
  answerMatchPairs: { left: string; right: string }[]; // Pares correctos
}
