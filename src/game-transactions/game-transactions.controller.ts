import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { GameTransactionsService } from './game-transactions.service';
import { GameCronService } from './services/game-cron.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { ResourceType } from '../database/entities/gameTransaction.entity';
import { AuthGuard } from '../user/guards/auth/auth.guard';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { Roles } from '../user/decorators/roles.decorator';

@Controller('game-transactions')
@UseGuards(AuthGuard)
export class GameTransactionsController {
  constructor(
    private readonly transactionsService: GameTransactionsService,
    private readonly cronService: GameCronService,
  ) {}

  /**
   * Crear una nueva transacción
   * Solo admins y teachers pueden crear transacciones manualmente
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  async createTransaction(@Body() dto: CreateTransactionDto) {
    const transaction = await this.transactionsService.createTransaction(dto);
    return {
      statusCode: 201,
      message: 'Transacción creada exitosamente',
      data: transaction,
    };
  }

  /**
   * Consultar transacciones con filtros
   */
  @Get()
  async queryTransactions(@Query() query: QueryTransactionsDto) {
    const result = await this.transactionsService.queryTransactions(query);
    return {
      statusCode: 200,
      message: 'Transacciones obtenidas exitosamente',
      ...result,
    };
  }

  /**
   * Obtener transacciones de un usuario específico
   */
  @Get('user/:userId')
  async getUserTransactions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('resourceType') resourceType?: ResourceType,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 50,
  ) {
    const result = await this.transactionsService.getUserTransactions(
      userId,
      resourceType,
      page,
      limit,
    );
    return {
      statusCode: 200,
      message: 'Transacciones del usuario obtenidas exitosamente',
      ...result,
    };
  }

  /**
   * Obtener estadísticas de un usuario
   */
  @Get('stats/:userId')
  async getUserStats(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('resourceType') resourceType?: ResourceType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dto: UserStatsDto = { userId, resourceType, startDate, endDate };
    const stats = await this.transactionsService.getUserStats(dto);
    return {
      statusCode: 200,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats,
    };
  }

  /**
   * Obtener análisis de crecimiento de un usuario
   */
  @Get('growth/:userId')
  async getUserGrowth(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('resourceType') resourceType: ResourceType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dto: UserStatsDto = { userId, resourceType, startDate, endDate };
    const growth = await this.transactionsService.getUserGrowth(dto);
    return {
      statusCode: 200,
      message: 'Análisis de crecimiento obtenido exitosamente',
      data: growth,
    };
  }

  /**
   * Obtener leaderboard por tipo de recurso
   */
  @Get('leaderboard/:resourceType')
  async getLeaderboard(
    @Param('resourceType') resourceType: ResourceType,
    @Query('limit', ParseIntPipe) limit = 100,
  ) {
    const leaderboard = await this.transactionsService.getLeaderboard(resourceType, limit);
    return {
      statusCode: 200,
      message: 'Leaderboard obtenido exitosamente',
      data: leaderboard,
    };
  }

  /**
   * Obtener leaderboard con análisis de crecimiento en período
   */
  @Get('leaderboard/:resourceType/growth')
  async getLeaderboardWithGrowth(
    @Param('resourceType') resourceType: ResourceType,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit', ParseIntPipe) limit = 100,
  ) {
    const leaderboard = await this.transactionsService.getLeaderboardWithGrowth(
      resourceType,
      startDate,
      endDate,
      limit,
    );
    return {
      statusCode: 200,
      message: 'Leaderboard con crecimiento obtenido exitosamente',
      data: leaderboard,
    };
  }

  /**
   * Ejecutar manualmente el incremento de recursos (solo admin)
   */
  @Post('cron/manual-increment')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async manualIncrement() {
    await this.cronService.manualIncrement();
    return {
      statusCode: 200,
      message: 'Incremento manual ejecutado exitosamente',
    };
  }

  /**
   * Obtener estado del cron job
   */
  @Get('cron/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getCronStatus() {
    const status = this.cronService.getStatus();
    return {
      statusCode: 200,
      message: 'Estado del cron job obtenido exitosamente',
      data: status,
    };
  }
}
