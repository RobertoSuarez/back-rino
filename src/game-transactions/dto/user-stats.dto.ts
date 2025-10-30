import { IsEnum, IsOptional, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '../../database/entities/gameTransaction.entity';

export class UserStatsDto {
  @IsInt()
  @Type(() => Number)
  userId: number;

  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UserStatsResponse {
  userId: number;
  resourceType: ResourceType;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  netChange: number;
  transactionCount: number;
  averagePerTransaction: number;
  largestEarn: number;
  largestSpend: number;
  periodStart?: Date;
  periodEnd?: Date;
}

export class UserGrowthResponse {
  userId: number;
  resourceType: ResourceType;
  dailyGrowth: Array<{
    date: string;
    earned: number;
    spent: number;
    net: number;
    balance: number;
  }>;
  weeklyGrowth: Array<{
    week: string;
    earned: number;
    spent: number;
    net: number;
    balance: number;
  }>;
  monthlyGrowth: Array<{
    month: string;
    earned: number;
    spent: number;
    net: number;
    balance: number;
  }>;
}
