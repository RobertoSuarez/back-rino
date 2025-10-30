import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ResourceType, TransactionType, TransactionReason } from '../../database/entities/gameTransaction.entity';

export class CreateTransactionDto {
  @IsInt()
  userId: number;

  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsEnum(TransactionReason)
  reason: TransactionReason;

  @IsInt()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  relatedActivityId?: number;

  @IsOptional()
  @IsInt()
  relatedChapterId?: number;

  @IsOptional()
  @IsInt()
  relatedCourseId?: number;

  @IsOptional()
  @IsInt()
  relatedAssessmentId?: number;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsInt()
  adjustedByUserId?: number;
}
