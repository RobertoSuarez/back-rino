import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseTable } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity()
export class Institution extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @OneToMany(() => User, (user) => user.institution)
  users: User[];
}
