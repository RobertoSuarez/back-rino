import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';
import { AuthGuard } from 'src/user/guards/auth/auth.guard';

@Controller('configkey')
@UseGuards(AuthGuard)
export class ConfigkeyController {
  constructor(private _configkeyService: ConfigkeyService) {}

  @Get('openai')
  async getKeyOpenAI(@Request() req) {
    const user = req.user;

    if (user.typeUser != 'admin') {
      throw new Error('Acceso no autorizado');
    }

    const key = await this._configkeyService.getKeyOpenAI();
    return {
      key,
    };
  }

  @Patch('openai')
  async setKeyOpenAI(@Request() req, @Body() payload: { key: string }) {
    const user = req.user;

    if (user.typeUser != 'admin') {
      throw new Error('Acceso no autorizado');
    }

    await this._configkeyService.setKeyOpenAI(payload.key);
  }

  @Get('gemini')
  async getKeyGemini(@Request() req) {
    const user = req.user;

    if (user.typeUser != 'admin') {
      throw new Error('Acceso no autorizado');
    }

    const key = await this._configkeyService.getKeyGemini();
    return {
      key,
    };
  }

  @Patch('gemini')
  async setKeyGemini(@Request() req, @Body() payload: { key: string }) {
    const user = req.user;

    if (user.typeUser != 'admin') {
      throw new Error('Acceso no autorizado');
    }

    await this._configkeyService.setKeyGemini(payload.key);
  }
}
