import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiKeyService } from '../services/api-key.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../dtos/api-key.dto';
import { AuthGuard } from '../../user/guards/auth/auth.guard';
import { RolesGuard } from '../../user/guards/roles/roles.guard';
import { Roles } from '../../user/decorators/roles.decorator';

@ApiTags('api-keys')
@UseGuards(AuthGuard)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @ApiOperation({ summary: 'Obtiene todas las API Keys' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  async findAll() {
    return await this.apiKeyService.findAll();
  }

  @ApiOperation({ summary: 'Crea una nueva API Key' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  async create(
    @Body() payload: CreateApiKeyDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const { id: userId } = req.user;
    return await this.apiKeyService.create(payload, userId, ip, userAgent);
  }

  @ApiOperation({ summary: 'Actualiza una API Key' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateApiKeyDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const { id: userId } = req.user;
    return await this.apiKeyService.update(id, payload, userId, ip, userAgent);
  }

  @ApiOperation({ summary: 'Activa/Desactiva una API Key' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/toggle')
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const { id: userId } = req.user;
    return await this.apiKeyService.toggleActive(id, userId, ip, userAgent);
  }

  @ApiOperation({ summary: 'Obtiene el historial de una API Key' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id/history')
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return await this.apiKeyService.getHistory(id);
  }

  @ApiOperation({ summary: 'Elimina una API Key' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const { id: userId } = req.user;
    await this.apiKeyService.delete(id, userId, ip, userAgent);
    return { message: 'API Key eliminada exitosamente' };
  }
}
