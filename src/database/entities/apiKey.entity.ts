import { BaseTable } from '../../common/entities/base.entity';
import { User } from './user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ApiKey extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  keyName: string; // Ej: 'GEMINI_API_KEY'

  @Column({ type: 'text' })
  keyValue: string; // El valor encriptado de la API Key

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  updatedBy: User;

  @OneToMany('ApiKeyHistory', 'apiKey')
  history: any[];
}
