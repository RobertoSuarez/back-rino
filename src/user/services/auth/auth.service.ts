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

    const url = `http://localhost:4200/authentication/change-password?token=${resetPassword.token}`;

    this.mailerService
      .sendMail({
        to: payload.email,
        from: 'rino@gmail.com',
        subject: 'Recuperación de contraseña',
        text: 'No este es el correo de recuperación de contraseña',
        html: `<h4>Recuperación de contraseña</h4><p>Direción para reestablecer la contraseña: ${url} </p>`,
      })
      .then(() => console.log('Enviado'))
      .catch((error) => console.log(error));
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
