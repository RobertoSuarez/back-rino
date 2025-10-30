import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseTable } from '../../common/entities/base.entity';
import { User } from './user.entity';

export enum ResourceType {
  YACHAY = 'yachay',
  TUMIS = 'tumis',
  MULLU = 'mullu',
}

export enum TransactionType {
  EARN = 'earn',        // Ganancia
  SPEND = 'spend',      // Gasto
  BONUS = 'bonus',      // Bonificación
  PENALTY = 'penalty',  // Penalización
  ADJUSTMENT = 'adjustment', // Ajuste manual
  REWARD = 'reward',    // Recompensa
}

export enum TransactionReason {
  // Yachay
  ACTIVITY_COMPLETED = 'activity_completed',
  CHAPTER_COMPLETED = 'chapter_completed',
  COURSE_COMPLETED = 'course_completed',
  ASSESSMENT_PASSED = 'assessment_passed',
  DAILY_LOGIN = 'daily_login',
  STREAK_BONUS = 'streak_bonus',
  
  // Tumis
  DAILY_REFRESH = 'daily_refresh',
  ACTIVITY_FAILED = 'activity_failed',
  PURCHASED = 'purchased',
  
  // Mullu
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  REFERRAL_BONUS = 'referral_bonus',
  ITEM_PURCHASED = 'item_purchased',
  SUBSCRIPTION_REWARD = 'subscription_reward',
  
  // General
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  SYSTEM_CORRECTION = 'system_correction',
  OTHER = 'other',
}

@Entity()
@Index(['userId', 'createdAt'])
@Index(['resourceType', 'createdAt'])
@Index(['transactionType', 'createdAt'])
export class GameTransaction extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ResourceType,
  })
  resourceType: ResourceType;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionReason,
  })
  reason: TransactionReason;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int' })
  balanceBefore: number;

  @Column({ type: 'int' })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Metadata para referencias
  @Column({ type: 'int', nullable: true })
  relatedActivityId: number;

  @Column({ type: 'int', nullable: true })
  relatedChapterId: number;

  @Column({ type: 'int', nullable: true })
  relatedCourseId: number;

  @Column({ type: 'int', nullable: true })
  relatedAssessmentId: number;

  // Metadata adicional en formato JSON
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Usuario que realizó el ajuste (para ajustes manuales)
  @Column({ type: 'int', nullable: true })
  adjustedByUserId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'adjustedByUserId' })
  adjustedBy: User;
}
