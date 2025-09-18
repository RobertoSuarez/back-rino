import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from '../../../user/services/auth/auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  RecoverPasswordDto,
  SetterPasswordDto,
} from '../../../user/dtos/login.dtos';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Inicio de sesión de usuario' })
  async login(@Body() payload: LoginDto) {
    try {
      const response = await this.authService.login(payload);
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Obtiene el perfil del usuario, en base al token' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('recover-password')
  @ApiOperation({
    summary:
      'Proceso para la recuperación de la contraseña, el endpoint envía un correo electrónico con la dirección para restablecer la contraseña',
  })
  async recoverPassword(@Body() payload: RecoverPasswordDto) {
    try {
      await this.authService.recoverPassword(payload);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('set-password')
  @ApiOperation({ summary: 'Actualizamos la contraseña en la base de datos' })
  async setPassword(@Body() payload: SetterPasswordDto) {
    try {
      const message = await this.authService.setPassword(payload);
      return {
        message,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('change-password-from-inside')
  @UseGuards(AuthGuard)
  async changePasswordFromInside(
    @Request() req,
    @Body() payload: ChangePasswordDto,
  ) {
    const { id } = req.user;
    return await this.authService.changePasswordFromInside(id, payload);
  }
}
