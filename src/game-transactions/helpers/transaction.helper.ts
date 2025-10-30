import { Injectable } from '@nestjs/common';
import { GameTransactionsService } from '../game-transactions.service';
import { ResourceType, TransactionType, TransactionReason } from '../../database/entities/gameTransaction.entity';

/**
 * Helper para facilitar la creación de transacciones desde otros módulos
 */
@Injectable()
export class TransactionHelper {
  constructor(private readonly transactionsService: GameTransactionsService) {}

  /**
   * Otorga Yachay por completar una actividad
   */
  async rewardActivityCompletion(
    userId: number,
    activityId: number,
    amount: number,
    description?: string,
  ) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.YACHAY,
      transactionType: TransactionType.EARN,
      reason: TransactionReason.ACTIVITY_COMPLETED,
      amount,
      description: description || `Yachay ganado por completar actividad`,
      relatedActivityId: activityId,
    });
  }

  /**
   * Otorga Yachay por completar un capítulo
   */
  async rewardChapterCompletion(
    userId: number,
    chapterId: number,
    amount: number,
    description?: string,
  ) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.YACHAY,
      transactionType: TransactionType.EARN,
      reason: TransactionReason.CHAPTER_COMPLETED,
      amount,
      description: description || `Yachay ganado por completar capítulo`,
      relatedChapterId: chapterId,
    });
  }

  /**
   * Otorga Yachay por completar un curso
   */
  async rewardCourseCompletion(
    userId: number,
    courseId: number,
    amount: number,
    description?: string,
  ) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.YACHAY,
      transactionType: TransactionType.EARN,
      reason: TransactionReason.COURSE_COMPLETED,
      amount,
      description: description || `Yachay ganado por completar curso`,
      relatedCourseId: courseId,
    });
  }

  /**
   * Otorga Yachay por aprobar una evaluación
   */
  async rewardAssessmentPassed(
    userId: number,
    assessmentId: number,
    amount: number,
    score: number,
    description?: string,
  ) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.YACHAY,
      transactionType: TransactionType.EARN,
      reason: TransactionReason.ASSESSMENT_PASSED,
      amount,
      description: description || `Yachay ganado por aprobar evaluación`,
      relatedAssessmentId: assessmentId,
      metadata: { score },
    });
  }

  /**
   * Otorga Yachay por login diario
   */
  async rewardDailyLogin(userId: number, amount: number, streak?: number) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.YACHAY,
      transactionType: TransactionType.BONUS,
      reason: TransactionReason.DAILY_LOGIN,
      amount,
      description: `Yachay ganado por login diario`,
      metadata: { streak },
    });
  }

  /**
   * Otorga bonificación por racha de días consecutivos
   */
  async rewardStreak(userId: number, amount: number, streak: number) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.YACHAY,
      transactionType: TransactionType.BONUS,
      reason: TransactionReason.STREAK_BONUS,
      amount,
      description: `Bonificación por ${streak} días consecutivos`,
      metadata: { streak },
    });
  }

  /**
   * Recarga Tumis diarios
   */
  async refreshDailyTumis(userId: number, amount: number) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.TUMIS,
      transactionType: TransactionType.EARN,
      reason: TransactionReason.DAILY_REFRESH,
      amount,
      description: `Recarga diaria de Tumis`,
    });
  }

  /**
   * Descuenta Tumis por fallar una actividad
   */
  async penalizeActivityFailed(userId: number, activityId: number, amount: number) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.TUMIS,
      transactionType: TransactionType.SPEND,
      reason: TransactionReason.ACTIVITY_FAILED,
      amount,
      description: `Tumis perdidos por fallar actividad`,
      relatedActivityId: activityId,
    });
  }

  /**
   * Usuario compra Tumis con Mullu
   */
  async purchaseTumis(userId: number, tumisAmount: number, mulluCost: number) {
    // Primero gastar Mullu
    await this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.MULLU,
      transactionType: TransactionType.SPEND,
      reason: TransactionReason.PURCHASED,
      amount: mulluCost,
      description: `Mullu gastado en compra de Tumis`,
      metadata: { tumisAmount },
    });

    // Luego dar Tumis
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.TUMIS,
      transactionType: TransactionType.EARN,
      reason: TransactionReason.PURCHASED,
      amount: tumisAmount,
      description: `Tumis comprados con Mullu`,
      metadata: { mulluCost },
    });
  }

  /**
   * Otorga Mullu por logro desbloqueado
   */
  async rewardAchievement(
    userId: number,
    amount: number,
    achievementName: string,
    achievementId?: number,
  ) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.MULLU,
      transactionType: TransactionType.REWARD,
      reason: TransactionReason.ACHIEVEMENT_UNLOCKED,
      amount,
      description: `Mullu ganado por logro: ${achievementName}`,
      metadata: { achievementName, achievementId },
    });
  }

  /**
   * Otorga Mullu por referir a otro usuario
   */
  async rewardReferral(userId: number, amount: number, referredUserId: number) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.MULLU,
      transactionType: TransactionType.BONUS,
      reason: TransactionReason.REFERRAL_BONUS,
      amount,
      description: `Mullu ganado por referir usuario`,
      metadata: { referredUserId },
    });
  }

  /**
   * Usuario compra un item con Mullu
   */
  async purchaseItem(
    userId: number,
    amount: number,
    itemName: string,
    itemId?: number,
  ) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.MULLU,
      transactionType: TransactionType.SPEND,
      reason: TransactionReason.ITEM_PURCHASED,
      amount,
      description: `Mullu gastado en: ${itemName}`,
      metadata: { itemName, itemId },
    });
  }

  /**
   * Otorga Mullu por suscripción a curso
   */
  async rewardSubscription(userId: number, amount: number, courseId: number) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType: ResourceType.MULLU,
      transactionType: TransactionType.REWARD,
      reason: TransactionReason.SUBSCRIPTION_REWARD,
      amount,
      description: `Mullu ganado por suscripción a curso`,
      relatedCourseId: courseId,
    });
  }

  /**
   * Ajuste manual por administrador
   */
  async adminAdjustment(
    userId: number,
    resourceType: ResourceType,
    newBalance: number,
    adminUserId: number,
    reason: string,
  ) {
    return this.transactionsService.createTransaction({
      userId,
      resourceType,
      transactionType: TransactionType.ADJUSTMENT,
      reason: TransactionReason.ADMIN_ADJUSTMENT,
      amount: newBalance,
      description: reason,
      adjustedByUserId: adminUserId,
    });
  }
}
