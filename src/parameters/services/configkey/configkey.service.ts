import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigKey } from 'src/database/entities/configkey.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConfigkeyService {
  private readonly logger = new Logger(ConfigkeyService.name);
  constructor(
    @InjectRepository(ConfigKey) private configkeyRepo: Repository<ConfigKey>,
  ) {}

  async getKeyOpenAI() {
    const config = await this.configkeyRepo.findOne({
      where: {
        serviceName: 'OPENAI',
      },
    });

    if (!config) {
      this.logger.error('OpenAI key not found');
      return null;
    }

    return config.key;
  }

  async setKeyOpenAI(key: string) {
    const config = await this.configkeyRepo.findOne({
      where: {
        serviceName: 'OPENAI',
      },
    });

    config.key = key;

    await this.configkeyRepo.save(config);
  }
}
