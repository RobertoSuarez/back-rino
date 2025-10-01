import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ApiKey } from '../../database/entities/apiKey.entity';
import { ApiKeyHistory } from '../../database/entities/apiKeyHistory.entity';
import { User } from '../../database/entities/user.entity';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../dtos/api-key.dto';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../common/constants';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  private readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this-in-production';
  private readonly ALGORITHM = 'aes-256-cbc';

  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(ApiKeyHistory)
    private historyRepo: Repository<ApiKeyHistory>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Encripta un valor
   */
  private encrypt(text: string): string {
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Desencripta un valor
   */
  private decrypt(text: string): string {
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Enmascara una API Key mostrando solo primeros y últimos 4 caracteres
   */
  private maskApiKey(value: string): string {
    if (value.length <= 8) return '****';
    return value.substring(0, 4) + '****' + value.substring(value.length - 4);
  }

  /**
   * Registra un cambio en el historial
   */
  private async logHistory(
    apiKey: ApiKey,
    action: string,
    userId: number,
    previousValue: string | null,
    newValue: string | null,
    description: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const user = await this.userRepo.findOneBy({ id: userId });
    
    const history = new ApiKeyHistory();
    history.apiKey = apiKey;
    history.action = action;
    history.previousValue = previousValue ? this.maskApiKey(previousValue) : null;
    history.newValue = newValue ? this.maskApiKey(newValue) : null;
    history.description = description;
    history.performedBy = user;
    history.ipAddress = ipAddress;
    history.userAgent = userAgent;

    await this.historyRepo.save(history);
  }

  /**
   * Obtiene todas las API Keys
   */
  async findAll(): Promise<any[]> {
    const apiKeys = await this.apiKeyRepo.find({
      where: { deletedAt: IsNull() },
      relations: ['createdBy', 'updatedBy'],
      order: { createdAt: 'DESC' },
    });

    return apiKeys.map(key => ({
      id: key.id,
      keyName: key.keyName,
      maskedValue: this.maskApiKey(this.decrypt(key.keyValue)),
      description: key.description,
      isActive: key.isActive,
      createdBy: key.createdBy ? {
        id: key.createdBy.id,
        firstName: key.createdBy.firstName,
        lastName: key.createdBy.lastName,
        email: key.createdBy.email,
      } : null,
      updatedBy: key.updatedBy ? {
        id: key.updatedBy.id,
        firstName: key.updatedBy.firstName,
        lastName: key.updatedBy.lastName,
        email: key.updatedBy.email,
      } : null,
      createdAt: DateTime.fromISO(key.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      updatedAt: DateTime.fromISO(key.updatedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    }));
  }

  /**
   * Crea una nueva API Key
   */
  async create(
    payload: CreateApiKeyDto,
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    // Verificar si ya existe una key con ese nombre
    const existing = await this.apiKeyRepo.findOne({
      where: { keyName: payload.keyName, deletedAt: IsNull() },
    });

    if (existing) {
      throw new Error('Ya existe una API Key con ese nombre');
    }

    const user = await this.userRepo.findOneBy({ id: userId });
    const encryptedValue = this.encrypt(payload.keyValue);

    const apiKey = new ApiKey();
    apiKey.keyName = payload.keyName;
    apiKey.keyValue = encryptedValue;
    apiKey.description = payload.description;
    apiKey.createdBy = user;
    apiKey.updatedBy = user;

    const saved = await this.apiKeyRepo.save(apiKey);

    // Registrar en historial
    await this.logHistory(
      saved,
      'CREATE',
      userId,
      null,
      payload.keyValue,
      'API Key creada',
      ipAddress,
      userAgent,
    );

    return {
      id: saved.id,
      keyName: saved.keyName,
      maskedValue: this.maskApiKey(payload.keyValue),
      message: 'API Key creada exitosamente',
    };
  }

  /**
   * Actualiza una API Key
   */
  async update(
    id: number,
    payload: UpdateApiKeyDto,
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    const apiKey = await this.apiKeyRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!apiKey) {
      throw new Error('API Key no encontrada');
    }

    const user = await this.userRepo.findOneBy({ id: userId });
    const previousValue = this.decrypt(apiKey.keyValue);
    const encryptedValue = this.encrypt(payload.keyValue);

    apiKey.keyValue = encryptedValue;
    apiKey.description = payload.description || apiKey.description;
    apiKey.updatedBy = user;

    const saved = await this.apiKeyRepo.save(apiKey);

    // Registrar en historial
    await this.logHistory(
      saved,
      'UPDATE',
      userId,
      previousValue,
      payload.keyValue,
      'API Key actualizada',
      ipAddress,
      userAgent,
    );

    return {
      id: saved.id,
      keyName: saved.keyName,
      maskedValue: this.maskApiKey(payload.keyValue),
      message: 'API Key actualizada exitosamente',
    };
  }

  /**
   * Activa/Desactiva una API Key
   */
  async toggleActive(
    id: number,
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    const apiKey = await this.apiKeyRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!apiKey) {
      throw new Error('API Key no encontrada');
    }

    const user = await this.userRepo.findOneBy({ id: userId });
    apiKey.isActive = !apiKey.isActive;
    apiKey.updatedBy = user;

    const saved = await this.apiKeyRepo.save(apiKey);

    // Registrar en historial
    await this.logHistory(
      saved,
      apiKey.isActive ? 'ACTIVATE' : 'DEACTIVATE',
      userId,
      null,
      null,
      `API Key ${apiKey.isActive ? 'activada' : 'desactivada'}`,
      ipAddress,
      userAgent,
    );

    return {
      id: saved.id,
      isActive: saved.isActive,
      message: `API Key ${saved.isActive ? 'activada' : 'desactivada'} exitosamente`,
    };
  }

  /**
   * Obtiene el historial de una API Key
   */
  async getHistory(id: number): Promise<any[]> {
    const history = await this.historyRepo.find({
      where: { apiKey: { id }, deletedAt: IsNull() },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
    });

    return history.map(h => ({
      id: h.id,
      action: h.action,
      previousValue: h.previousValue,
      newValue: h.newValue,
      description: h.description,
      performedBy: {
        id: h.performedBy.id,
        firstName: h.performedBy.firstName,
        lastName: h.performedBy.lastName,
        email: h.performedBy.email,
      },
      ipAddress: h.ipAddress,
      createdAt: DateTime.fromISO(h.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    }));
  }

  /**
   * Obtiene el valor real de una API Key por nombre (para uso interno)
   */
  async getKeyValue(keyName: string): Promise<string | null> {
    const apiKey = await this.apiKeyRepo.findOne({
      where: { keyName, isActive: true, deletedAt: IsNull() },
    });

    if (!apiKey) {
      return null;
    }

    return this.decrypt(apiKey.keyValue);
  }

  /**
   * Elimina una API Key (soft delete)
   */
  async delete(
    id: number,
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const apiKey = await this.apiKeyRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!apiKey) {
      throw new Error('API Key no encontrada');
    }

    // Registrar en historial antes de eliminar
    await this.logHistory(
      apiKey,
      'DELETE',
      userId,
      null,
      null,
      'API Key eliminada',
      ipAddress,
      userAgent,
    );

    await this.apiKeyRepo.softDelete(id);
  }
}
