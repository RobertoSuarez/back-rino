import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigKey } from 'src/database/entities/configkey.entity';
import { Repository } from 'typeorm';

const SERVICE_OPENAI = 'OPENAI';
const SERVICE_GEMINI = 'GEMINI_API_KEY';

@Injectable()
export class ConfigkeyService {
  private readonly logger = new Logger(ConfigkeyService.name);
  constructor(
    @InjectRepository(ConfigKey) private configkeyRepo: Repository<ConfigKey>,
  ) {}

  private async findConfigByServiceName(serviceName: string) {
    return this.configkeyRepo.findOne({
      where: {
        serviceName,
      },
    });
  }

  private async getKeyByService(serviceName: string) {
    const config = await this.findConfigByServiceName(serviceName);

    if (!config) {
      this.logger.warn(`${serviceName} key not found`);
      return null;
    }

    return config.key;
  }

  private async setKeyByService(serviceName: string, key: string) {
    const config = await this.findConfigByServiceName(serviceName);

    if (!config) {
      this.logger.error(`${serviceName} key not found`);
      throw new Error(`${serviceName} key not found`);
    }

    config.key = key;

    await this.configkeyRepo.save(config);
  }

  async getKeyOpenAI() {
    return this.getKeyByService(SERVICE_OPENAI);
  }

  async setKeyOpenAI(key: string) {
    await this.setKeyByService(SERVICE_OPENAI, key);
  }

  async getKeyGemini() {
    return this.getKeyByService(SERVICE_GEMINI);
  }

  async setKeyGemini(key: string) {
    await this.setKeyByService(SERVICE_GEMINI, key);
  }
}
