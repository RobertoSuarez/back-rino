import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { GameTransaction, ResourceType, TransactionType } from '../database/entities/gameTransaction.entity';
import { User } from '../database/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UserStatsDto, UserStatsResponse, UserGrowthResponse } from './dto/user-stats.dto';

@Injectable()
export class GameTransactionsService {
  constructor(
    @InjectRepository(GameTransaction)
    private readonly transactionRepository: Repository<GameTransaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crea una transacción y actualiza el balance del usuario
   */
  async createTransaction(dto: CreateTransactionDto): Promise<GameTransaction> {
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${dto.userId} no encontrado`);
    }

    // Obtener balance actual según el tipo de recurso
    let balanceBefore: number;
    switch (dto.resourceType) {
      case ResourceType.YACHAY:
        balanceBefore = user.yachay;
        break;
      case ResourceType.TUMIS:
        balanceBefore = user.tumis;
        break;
      case ResourceType.MULLU:
        balanceBefore = user.mullu;
        break;
    }

    // Calcular nuevo balance
    let balanceAfter = balanceBefore;
    if (dto.transactionType === TransactionType.EARN || 
        dto.transactionType === TransactionType.BONUS || 
        dto.transactionType === TransactionType.REWARD) {
      balanceAfter += dto.amount;
    } else if (dto.transactionType === TransactionType.SPEND || 
               dto.transactionType === TransactionType.PENALTY) {
      balanceAfter -= dto.amount;
      if (balanceAfter < 0) {
        throw new BadRequestException(`Balance insuficiente. Balance actual: ${balanceBefore}, Cantidad requerida: ${dto.amount}`);
      }
    } else if (dto.transactionType === TransactionType.ADJUSTMENT) {
      // Para ajustes, el amount puede ser positivo o negativo
      balanceAfter = dto.amount;
    }

    // Crear la transacción
    const transaction = this.transactionRepository.create({
      ...dto,
      balanceBefore,
      balanceAfter,
    });

    // Guardar la transacción
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Actualizar el balance del usuario
    switch (dto.resourceType) {
      case ResourceType.YACHAY:
        user.yachay = balanceAfter;
        break;
      case ResourceType.TUMIS:
        user.tumis = balanceAfter;
        break;
      case ResourceType.MULLU:
        user.mullu = balanceAfter;
        break;
    }

    await this.userRepository.save(user);

    return savedTransaction;
  }

  /**
   * Consulta transacciones con filtros
   */
  async queryTransactions(dto: QueryTransactionsDto) {
    const { page = 1, limit = 50, startDate, endDate, ...filters } = dto;
    
    const where: any = { ...filters };

    // Filtro por rango de fechas
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['user', 'adjustedBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene el historial de transacciones de un usuario
   */
  async getUserTransactions(userId: number, resourceType?: ResourceType, page = 1, limit = 50) {
    const where: any = { userId };
    if (resourceType) {
      where.resourceType = resourceType;
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene estadísticas de un usuario
   */
  async getUserStats(dto: UserStatsDto): Promise<UserStatsResponse[]> {
    const { userId, resourceType, startDate, endDate } = dto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const resourceTypes = resourceType 
      ? [resourceType] 
      : [ResourceType.YACHAY, ResourceType.TUMIS, ResourceType.MULLU];

    const stats: UserStatsResponse[] = [];

    for (const resType of resourceTypes) {
      const where: any = { userId, resourceType: resType };

      if (startDate && endDate) {
        where.createdAt = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        where.createdAt = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        where.createdAt = LessThanOrEqual(new Date(endDate));
      }

      const transactions = await this.transactionRepository.find({ where });

      let currentBalance = 0;
      switch (resType) {
        case ResourceType.YACHAY:
          currentBalance = user.yachay;
          break;
        case ResourceType.TUMIS:
          currentBalance = user.tumis;
          break;
        case ResourceType.MULLU:
          currentBalance = user.mullu;
          break;
      }

      const totalEarned = transactions
        .filter(t => [TransactionType.EARN, TransactionType.BONUS, TransactionType.REWARD].includes(t.transactionType))
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSpent = transactions
        .filter(t => [TransactionType.SPEND, TransactionType.PENALTY].includes(t.transactionType))
        .reduce((sum, t) => sum + t.amount, 0);

      const netChange = totalEarned - totalSpent;

      const earnTransactions = transactions.filter(t => 
        [TransactionType.EARN, TransactionType.BONUS, TransactionType.REWARD].includes(t.transactionType)
      );
      const largestEarn = earnTransactions.length > 0 
        ? Math.max(...earnTransactions.map(t => t.amount)) 
        : 0;

      const spendTransactions = transactions.filter(t => 
        [TransactionType.SPEND, TransactionType.PENALTY].includes(t.transactionType)
      );
      const largestSpend = spendTransactions.length > 0 
        ? Math.max(...spendTransactions.map(t => t.amount)) 
        : 0;

      stats.push({
        userId,
        resourceType: resType,
        currentBalance,
        totalEarned,
        totalSpent,
        netChange,
        transactionCount: transactions.length,
        averagePerTransaction: transactions.length > 0 ? netChange / transactions.length : 0,
        largestEarn,
        largestSpend,
        periodStart: startDate ? new Date(startDate) : undefined,
        periodEnd: endDate ? new Date(endDate) : undefined,
      });
    }

    return stats;
  }

  /**
   * Obtiene el crecimiento de un usuario a lo largo del tiempo
   */
  async getUserGrowth(dto: UserStatsDto): Promise<UserGrowthResponse> {
    const { userId, resourceType, startDate, endDate } = dto;

    if (!resourceType) {
      throw new BadRequestException('resourceType es requerido para análisis de crecimiento');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const where: any = { userId, resourceType };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const transactions = await this.transactionRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });

    // Agrupar por día
    const dailyMap = new Map<string, { earned: number; spent: number; balance: number }>();
    
    transactions.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { earned: 0, spent: 0, balance: t.balanceBefore };

      if ([TransactionType.EARN, TransactionType.BONUS, TransactionType.REWARD].includes(t.transactionType)) {
        existing.earned += t.amount;
      } else if ([TransactionType.SPEND, TransactionType.PENALTY].includes(t.transactionType)) {
        existing.spent += t.amount;
      }

      existing.balance = t.balanceAfter;
      dailyMap.set(date, existing);
    });

    const dailyGrowth = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      earned: data.earned,
      spent: data.spent,
      net: data.earned - data.spent,
      balance: data.balance,
    }));

    // Agrupar por semana (simplificado)
    const weeklyMap = new Map<string, { earned: number; spent: number; balance: number }>();
    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const week = weekStart.toISOString().split('T')[0];
      
      const existing = weeklyMap.get(week) || { earned: 0, spent: 0, balance: t.balanceBefore };

      if ([TransactionType.EARN, TransactionType.BONUS, TransactionType.REWARD].includes(t.transactionType)) {
        existing.earned += t.amount;
      } else if ([TransactionType.SPEND, TransactionType.PENALTY].includes(t.transactionType)) {
        existing.spent += t.amount;
      }

      existing.balance = t.balanceAfter;
      weeklyMap.set(week, existing);
    });

    const weeklyGrowth = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      earned: data.earned,
      spent: data.spent,
      net: data.earned - data.spent,
      balance: data.balance,
    }));

    // Agrupar por mes
    const monthlyMap = new Map<string, { earned: number; spent: number; balance: number }>();
    transactions.forEach(t => {
      const month = t.createdAt.toISOString().substring(0, 7); // YYYY-MM
      
      const existing = monthlyMap.get(month) || { earned: 0, spent: 0, balance: t.balanceBefore };

      if ([TransactionType.EARN, TransactionType.BONUS, TransactionType.REWARD].includes(t.transactionType)) {
        existing.earned += t.amount;
      } else if ([TransactionType.SPEND, TransactionType.PENALTY].includes(t.transactionType)) {
        existing.spent += t.amount;
      }

      existing.balance = t.balanceAfter;
      monthlyMap.set(month, existing);
    });

    const monthlyGrowth = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      earned: data.earned,
      spent: data.spent,
      net: data.earned - data.spent,
      balance: data.balance,
    }));

    return {
      userId,
      resourceType,
      dailyGrowth,
      weeklyGrowth,
      monthlyGrowth,
    };
  }

  /**
   * Obtiene el ranking de usuarios por recurso
   */
  async getLeaderboard(resourceType: ResourceType, limit = 100) {
    let orderField: string;
    switch (resourceType) {
      case ResourceType.YACHAY:
        orderField = 'yachay';
        break;
      case ResourceType.TUMIS:
        orderField = 'tumis';
        break;
      case ResourceType.MULLU:
        orderField = 'mullu';
        break;
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.urlAvatar',
        'user.yachay',
        'user.tumis',
        'user.mullu',
      ])
      .where('user.typeUser = :type', { type: 'student' })
      .orderBy(`user.${orderField}`, 'DESC')
      .limit(limit)
      .getMany();

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      urlAvatar: user.urlAvatar,
      yachay: user.yachay,
      tumis: user.tumis,
      mullu: user.mullu,
      currentValue: user[orderField],
    }));
  }

  /**
   * Obtiene el ranking con crecimiento en un período
   */
  async getLeaderboardWithGrowth(
    resourceType: ResourceType,
    startDate: string,
    endDate: string,
    limit = 100,
  ) {
    const leaderboard = await this.getLeaderboard(resourceType, limit);

    const leaderboardWithGrowth = await Promise.all(
      leaderboard.map(async (entry) => {
        const transactions = await this.transactionRepository.find({
          where: {
            userId: entry.userId,
            resourceType,
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        });

        const earned = transactions
          .filter(t => [TransactionType.EARN, TransactionType.BONUS, TransactionType.REWARD].includes(t.transactionType))
          .reduce((sum, t) => sum + t.amount, 0);

        const spent = transactions
          .filter(t => [TransactionType.SPEND, TransactionType.PENALTY].includes(t.transactionType))
          .reduce((sum, t) => sum + t.amount, 0);

        const growth = earned - spent;
        const growthPercentage = entry.currentValue > 0 
          ? ((growth / (entry.currentValue - growth)) * 100).toFixed(2)
          : '0.00';

        return {
          ...entry,
          periodGrowth: growth,
          periodEarned: earned,
          periodSpent: spent,
          growthPercentage: parseFloat(growthPercentage),
        };
      }),
    );

    return leaderboardWithGrowth;
  }
}
