import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { GameTransaction, ResourceType, TransactionType, TransactionReason } from '../../database/entities/gameTransaction.entity';
import { TumisOfferDto, BuyTumisDto, TumisTransactionResponseDto } from '../dto/tumis-offer.dto';

@Injectable()
export class TumisShopService {
  // Ofertas predefinidas
  private readonly TUMIS_OFFERS: TumisOfferDto[] = [
    {
      id: 1,
      tumisAmount: 1,
      mulluCost: 100,
      isPromotion: false,
      description: '1 Vida'
    },
    {
      id: 2,
      tumisAmount: 5,
      mulluCost: 400,
      isPromotion: true,
      promotionLabel: '¡GRAN PROMOCIÓN!',
      discount: 20, // 20% de descuento (normalmente costaría 500)
      description: '5 Vidas - ¡20% de descuento!'
    },
    {
      id: 3,
      tumisAmount: 10,
      mulluCost: 700,
      isPromotion: true,
      promotionLabel: '¡OFERTA ESPECIAL!',
      discount: 30, // 30% de descuento (normalmente costaría 1000)
      description: '10 Vidas - ¡30% de descuento!'
    }
  ];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GameTransaction)
    private gameTransactionRepository: Repository<GameTransaction>
  ) {}

  /**
   * Obtiene todas las ofertas disponibles de Tumis
   */
  getAvailableOffers(): TumisOfferDto[] {
    return this.TUMIS_OFFERS;
  }

  /**
   * Compra Tumis usando Mullu
   */
  async buyTumis(buyTumisDto: BuyTumisDto): Promise<TumisTransactionResponseDto> {
    const { offerId, userId } = buyTumisDto;

    console.log('buyTumis recibido:', { offerId, userId, dto: buyTumisDto });

    // Validar que la oferta existe
    const offer = this.TUMIS_OFFERS.find(o => o.id === offerId);
    if (!offer) {
      throw new Error(`Oferta no encontrada: ${offerId}`);
    }

    // Obtener usuario
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`Usuario no encontrado: ${userId}`);
    }

    // Validar que tiene suficiente Mullu
    if (user.mullu < offer.mulluCost) {
      throw new Error(
        `Mullu insuficiente. Tienes ${user.mullu} Mullu pero necesitas ${offer.mulluCost}`
      );
    }

    // Registrar balances anteriores
    const mulluBefore = user.mullu;
    const tumisBefore = user.tumis;

    // Actualizar balances
    user.mullu -= offer.mulluCost;
    user.tumis += offer.tumisAmount;

    // Guardar usuario actualizado
    await this.userRepository.save(user);

    // Crear transacción de Mullu (gasto)
    const mulluTransaction = this.gameTransactionRepository.create({
      user,
      resourceType: ResourceType.MULLU,
      transactionType: TransactionType.SPEND,
      amount: offer.mulluCost,
      balanceBefore: mulluBefore,
      balanceAfter: user.mullu,
      reason: TransactionReason.ITEM_PURCHASED,
      description: `Compra de ${offer.tumisAmount} Tumis`,
      metadata: {
        offerId: offer.id,
        offerDescription: offer.description
      }
    });

    await this.gameTransactionRepository.save(mulluTransaction);

    // Crear transacción de Tumis (ganancia)
    const tumisTransaction = this.gameTransactionRepository.create({
      user,
      resourceType: ResourceType.TUMIS,
      transactionType: TransactionType.EARN,
      amount: offer.tumisAmount,
      balanceBefore: tumisBefore,
      balanceAfter: user.tumis,
      reason: TransactionReason.PURCHASED,
      description: `${offer.tumisAmount} Tumis comprados`,
      metadata: {
        offerId: offer.id,
        offerDescription: offer.description,
        mulluSpent: offer.mulluCost
      }
    });

    await this.gameTransactionRepository.save(tumisTransaction);

    // Retornar respuesta
    return {
      success: true,
      message: `¡Compra exitosa! Recibiste ${offer.tumisAmount} Tumis`,
      transaction: {
        id: tumisTransaction.id,
        userId: user.id,
        resourceType: ResourceType.TUMIS,
        transactionType: TransactionType.EARN,
        amount: offer.tumisAmount,
        balanceBefore: tumisBefore,
        balanceAfter: user.tumis,
        description: tumisTransaction.description,
        createdAt: tumisTransaction.createdAt
      },
      userBalance: {
        tumis: user.tumis,
        mullu: user.mullu
      }
    };
  }
}
