import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { TransactionHelper } from '../helpers/transaction.helper';
import { ResourceType, TransactionReason, TransactionType } from '../../database/entities/gameTransaction.entity';
import { GameTransactionsService } from '../game-transactions.service';

@Injectable()
export class GameCronService {
  private readonly logger = new Logger(GameCronService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly transactionHelper: TransactionHelper,
    private readonly transactionsService: GameTransactionsService,
  ) {}

  /**
   * Cron job que se ejecuta cada hora para incrementar recursos de estudiantes
   * Formato: segundo minuto hora día mes día-semana
   * '0 0 * * * *' = cada hora en el minuto 0 y segundo 0
   */
  @Cron('0 0 * * * *', {
    name: 'increment-student-resources',
    timeZone: 'America/Guayaquil', // Ajusta según tu zona horaria
  })
  async incrementStudentResources() {
    try {
      this.logger.debug('Iniciando incremento de recursos para estudiantes...');

      // Obtener todos los estudiantes activos
      const students = await this.userRepository.find({
        where: {
          typeUser: 'student',
          status: 'active', // Solo estudiantes activos
        },
      });

      if (students.length === 0) {
        this.logger.debug('No hay estudiantes activos para incrementar recursos');
        return;
      }

      this.logger.log(`Incrementando recursos para ${students.length} estudiantes`);

      // Procesar cada estudiante
      const results = await Promise.allSettled(
        students.map(async (student) => {
          try {
            // 1. Incrementar Tumis (1 por hora)
            await this.transactionsService.createTransaction({
              userId: student.id,
              resourceType: ResourceType.TUMIS,
              transactionType: TransactionType.BONUS,
              reason: TransactionReason.DAILY_REFRESH,
              amount: 1,
              description: 'Incremento automático por hora',
            });

            // 2. Incrementar Mullu (1 por hora)
            await this.transactionsService.createTransaction({
              userId: student.id,
              resourceType: ResourceType.MULLU,
              transactionType: TransactionType.BONUS,
              reason: TransactionReason.SUBSCRIPTION_REWARD,
              amount: 1,
              description: 'Incremento automático por hora',
            });

            // 3. Incrementar Yachay (1 por hora)
            await this.transactionsService.createTransaction({
              userId: student.id,
              resourceType: ResourceType.YACHAY,
              transactionType: TransactionType.BONUS,
              reason: TransactionReason.DAILY_LOGIN,
              amount: 1,
              description: 'Incremento automático por hora',
            });

            return { success: true, userId: student.id };
          } catch (error) {
            this.logger.error(
              `Error al incrementar recursos para estudiante ${student.id}: ${error.message}`,
            );
            return { success: false, userId: student.id, error: error.message };
          }
        }),
      );

      // Contar éxitos y fallos
      const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

      this.logger.log(
        `Incremento completado: ${successful} exitosos, ${failed} fallidos`,
      );
    } catch (error) {
      this.logger.error(`Error en cron job de incremento de recursos: ${error.message}`, error.stack);
    }
  }

  /**
   * Método para ejecutar manualmente el incremento (útil para testing)
   */
  async manualIncrement() {
    this.logger.log('Ejecutando incremento manual de recursos...');
    await this.incrementStudentResources();
  }

  /**
   * Método para obtener el estado del cron job
   */
  getStatus() {
    return {
      name: 'increment-student-resources',
      schedule: 'Cada minuto',
      description: 'Incrementa Tumis, Mullu y Yachay en 1 para todos los estudiantes activos',
      active: true,
    };
  }
}
