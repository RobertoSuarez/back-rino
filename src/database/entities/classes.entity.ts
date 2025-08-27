import { BaseTable } from '../../common/entities/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Matricula } from './matricula.entity';
import { Assessment } from './assessment.entity';

@Entity()
export class Classes extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.classes)
  teacher: User;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  academicPeriod: string;

  @Column({ default: '1ER NIVEL' })
  level: string;

  @Column()
  paralelo: string;

  @Column({ default: 'No tiene carrera' })
  carrera: string;

  @Column({ default: 'No tiene descripción' })
  description: string;

  @Column({ default: false })
  isPublic: boolean;

  @OneToMany(() => Matricula, (m) => m.class)
  matriculas: Matricula[];

  // Relacionamos la clase con la evaluación.
  @OneToMany(() => Assessment, (a) => a.class)
  assessments: Assessment;
}
