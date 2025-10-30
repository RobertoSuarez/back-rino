import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseTable } from '../../common/entities/base.entity';
import { ResetPassword } from './resetPassword.entity';
import { EmailVerification } from './emailVerification.entity';
import { Document } from '../../database/entities/document.entity';
import { Course } from '../../database/entities/course.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { ChapterProgressUser } from '../../database/entities/chapterProgressUser.entity';
import { TemaProgressUser } from '../../database/entities/temaProgressUser.entity';
import { Followers } from './followers.entity';
import { Chat } from './chat.entity';
import { ConfigKey } from './configkey.entity';
import { Classes } from './classes.entity';
import { Matricula } from './matricula.entity';
import { ActivityProgressUser } from './activityProgress.entity';
import { AssessmentOfUser } from './assessmentOfUser.entity';
import { LearningPath } from './learningPath.entity';
import { LearningPathSubscription } from './learningPathSubscription.entity';
import { Institution } from './institution.entity';
import { GameTransaction } from './gameTransaction.entity';

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index({ unique: true })
  email: string;

  @Column({ type: 'text' })
  password: string;

  @Column({ type: 'timestamptz', nullable: true })
  birthday: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsApp: string;

  @Column({ type: 'text', nullable: true })
  urlAvatar: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'varchar', length: 50 })
  typeUser: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  approved: boolean;

  @Column({ type: 'boolean', default: true })
  requiredUpdate: boolean;

  @Column({ default: 0 })
  yachay: number;

  @Column({ default: 0 })
  tumis: number;

  @Column({ default: 0 })
  mullu: number;

  @Column({ default: 0 })
  loginAmount: number;

  @OneToMany(() => ResetPassword, (resetPassword) => resetPassword.user)
  resetPasswords: ResetPassword[];

  @OneToMany(() => EmailVerification, (emailVerification) => emailVerification.user)
  emailVerifications: EmailVerification[];

  @OneToMany(() => Document, (doc) => doc.createdBy)
  documents: Document[];

  @OneToMany(() => Course, (c) => c.createdBy)
  courses: Course[];

  @OneToMany(() => Subscription, (s) => s.user)
  subscriptions: Subscription[];

  @OneToMany(() => ChapterProgressUser, (c) => c.user)
  chapterProgressUser: ChapterProgressUser[];

  @OneToMany(() => TemaProgressUser, (t) => t.user)
  temaProgressUser: TemaProgressUser[];

  // usuarios que sigues.
  @OneToMany(() => Followers, (f) => f.follower)
  followers: Followers[];

  // Mis seguidores
  @OneToMany(() => Followers, (f) => f.followed)
  myFollowers: Followers[];

  @OneToMany(() => Chat, (c) => c.user)
  chats: Chat[];

  @OneToMany(() => ConfigKey, (c) => c.createdBy)
  configKeys: ConfigKey[];

  @OneToMany(() => Classes, (c) => c.teacher)
  classes: Classes[];

  @OneToMany(() => Matricula, (m) => m.student)
  matriculas: Matricula[];

  @OneToMany(() => ActivityProgressUser, (a) => a.user)
  activityProgressUsers: ActivityProgressUser[];

  @OneToMany(() => AssessmentOfUser, (a) => a.student)
  assessmentsOfUsers: AssessmentOfUser[];

  @OneToMany(() => LearningPath, (lp) => lp.createdBy)
  learningPaths: LearningPath[];

  @OneToMany(() => LearningPathSubscription, (lps) => lps.student)
  learningPathSubscriptions: LearningPathSubscription[];

  @ManyToOne(() => Institution, (institution) => institution.users, { nullable: true })
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column({ nullable: true })
  institutionId: number;

  @OneToMany(() => GameTransaction, (gt) => gt.user)
  gameTransactions: GameTransaction[];
}
