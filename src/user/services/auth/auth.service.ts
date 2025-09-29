import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import {
  ChangePasswordDto,
  LoginDto,
  LoginResponseDto,
  RecoverPasswordDto,
  SetterPasswordDto,
} from '../../../user/dtos/login.dtos';
import { UserDto } from '../../dtos/users.dtos';

import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ResetPassword } from '../../../database/entities/resetPassword.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private _configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ResetPassword)
    private resetPasswordRepo: Repository<ResetPassword>,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async login(payload: LoginDto): Promise<LoginResponseDto> {
    // Buscamos el usuario por le correo.
    const user = await this.userRepo.findOne({
      where: { email: payload.email },
    });

    if (!user) {
      throw new Error('Usuario no registrado');
    }

    // TODO: Comparar las contraseñas pero con hash.
    if (user.password !== payload.password) {
      throw new Error('Credenciales incorrectas');
    }

    if (!user.approved) {
      throw new Error('Usuario no autorizado');
    }

    // Incrementar el contando
    user.loginAmount = user.loginAmount + 1;
    await this.userRepo.save(user);

    const userDto = plainToClass(UserDto, user, {
      excludeExtraneousValues: true,
    });

    // Generamos el JWT
    const accessToken = await this.jwtService.signAsync({ user: userDto });
    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        birthday: user.birthday
          ? DateTime.fromISO(user.birthday.toISOString()).toFormat(
              formatDateFrontend,
            )
          : null,
        whatsApp: user.whatsApp,
        urlAvatar: user.urlAvatar
          ? user.urlAvatar
          : `https://ui-avatars.com/api/?name=${user.firstName?.split(' ')[0]}+${user.lastName?.split(' ')[0]}&background=1B802F&color=fff`,
        status: user.status,
        typeUser: user.typeUser,
        requiredUpdate: user.requiredUpdate,
      },
      firstLogin: user.loginAmount === 1,
      accessToken: accessToken,
    };
  }

  async recoverPassword(payload: RecoverPasswordDto) {
    // Recuperamos el usuario
    const user = await this.userRepo.findOneBy({ email: payload.email });
    if (!user) {
      throw new Error('Usuario no registrado');
    }
    // Generamos el token
    const resetPassword = new ResetPassword();
    resetPassword.email = payload.email;
    resetPassword.token = uuid();
    resetPassword.used = false;

    // Guardamos el token
    this.resetPasswordRepo.save(resetPassword);

    const frontendUrl = this._configService.get('FRONTEND_URL');

    const url = `${frontendUrl}/auth/reset-password?token=${resetPassword.token}`;

    this.mailerService
      .sendMail({
        to: payload.email,
        from: 'El equipo de CyberImperium',
        subject: 'Recuperación de contraseña - CyberImperium',
        text: `Hola, has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace para crear una nueva contraseña: ${url}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a6ee0;">Recuperación de Contraseña</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="margin-bottom: 15px;">Hola,</p>
            <p style="margin-bottom: 15px;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #4a6ee0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablecer Contraseña</a>
            </div>
            <p style="margin-bottom: 15px;">Si no solicitaste restablecer tu contraseña, puedes ignorar este correo electrónico.</p>
            <p style="margin-bottom: 15px;">Este enlace expirará en 24 horas por seguridad.</p>
            <p style="margin-bottom: 5px;">Saludos,</p>
            <p style="margin-bottom: 15px;">El equipo de CyberImperium</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all;">${url}</p>
          </div>
        </div>
        `,
      })
  }

  async setPassword(payload: SetterPasswordDto): Promise<string> {
    const resetPassword = await this.resetPasswordRepo.findOneBy({
      token: payload.token,
    });

    if (!resetPassword) {
      throw new Error('Token no valido');
    }

    // Actualizamos la contraseña del usuario
    const user = await this.userRepo.findOneBy({ email: resetPassword.email });
    user.password = payload.newPassword;
    resetPassword.used = true;

    await this.resetPasswordRepo.save(resetPassword);
    await this.userRepo.save(user);

    return 'Contraseña actualizada';
  }

  async changePasswordFromInside(userId: number, payload: ChangePasswordDto) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.password !== payload.oldPassword) {
      throw new Error('Credenciales incorrectas');
    }

    user.password = payload.newPassword;
    await this.userRepo.save(user);
    return {
      message: 'Contraseña actualizada',
    };
  }
}
