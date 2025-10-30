import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TumisShopService } from '../services/tumis-shop.service';
import { BuyTumisDto, TumisTransactionResponseDto } from '../dto/tumis-offer.dto';
import { AuthGuard } from '../../user/guards/auth/auth.guard';

@Controller('tumis-shop')
export class TumisShopController {
  constructor(private tumisShopService: TumisShopService) {}

  /**
   * Obtiene todas las ofertas disponibles de Tumis
   */
  @Get('offers')
  getOffers() {
    return this.tumisShopService.getAvailableOffers();
  }

  /**
   * Compra Tumis usando Mullu
   */
  @Post('buy')
  @UseGuards(AuthGuard)
  async buyTumis(
    @Body() buyTumisDto: BuyTumisDto,
    @Request() req
  ): Promise<TumisTransactionResponseDto> {
    try {
      // Usar el ID del usuario autenticado
      buyTumisDto.userId = req.user.id;
      
      const result = await this.tumisShopService.buyTumis(buyTumisDto);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

