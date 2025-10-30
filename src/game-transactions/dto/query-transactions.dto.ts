import { IsEnum, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType, TransactionType, TransactionReason } from '../../database/entities/gameTransaction.entity';

export class QueryTransactionsDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionReason)
  reason?: TransactionReason;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  relatedActivityId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  relatedChapterId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  relatedCourseId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  relatedAssessmentId?: number;
}
