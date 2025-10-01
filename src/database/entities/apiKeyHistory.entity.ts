import { BaseTable } from '../../common/entities/base.entity';
import { User } from './user.entity';
import { ApiKey } from './apiKey.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ApiKeyHistory extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ApiKey, (apiKey) => apiKey.history)
  apiKey: ApiKey;

  @Column()
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE'

  @Column({ type: 'text', nullable: true })
  previousValue: string; // Valor anterior (primeros y últimos 4 caracteres)

  @Column({ type: 'text', nullable: true })
  newValue: string; // Nuevo valor (primeros y últimos 4 caracteres)

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User)
  performedBy: User;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;
}
