import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import {
  CreateUserDto,
  LivesWithGemsDto,
  UserUpdateDto,
  PaginatedUsersResponseDto,
  UserIndicatorsDto,
} from '../../dtos/users.dtos';
import { User } from '../../../database/entities/user.entity';
import { Repository, Like, ILike } from 'typeorm';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import { formatDateFrontend } from '../../../common/constants';
import { StatisticsService } from '../../../statistics/service/statistics/statistics.service';
import { Followers } from '../../../database/entities/followers.entity';
import { EmailVerification } from '../../../database/entities/emailVerification.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private _userRepo: Repository<User>,
    private _statisticsService: StatisticsService,
    @InjectRepository(Followers)
    private _followersRepository: Repository<Followers>,
    private _mailerService: MailerService,
    private _configService: ConfigService,
    @InjectRepository(EmailVerification)
    private _emailVerificationRepo: Repository<EmailVerification>,
  ) {}

  private async sendTeacherApprovalNotification(newTeacher: User) {
    // Obtener todos los administradores aprobados
    const admins = await this._userRepo.find({
      where: {
        typeUser: 'admin',
        approved: true,
      },
    });

    if (admins.length === 0) {
      console.warn('No se encontraron administradores aprobados para notificar');
      return;
    }

    const adminEmails = admins.map(admin => admin.email);
    const frontendUrl = this._configService.get('FRONTEND_URL');

    const subject = 'Nuevo profesor registrado - Requiere aprobación';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a6ee0;">Nuevo Profesor Registrado</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <p style="margin-bottom: 15px;">Hola Administrador,</p>
          <p style="margin-bottom: 15px;">Se ha registrado un nuevo profesor en la plataforma Cyber Imperium que requiere tu aprobación:</p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
            <p><strong>Nombre:</strong> ${newTeacher.firstName} ${newTeacher.lastName}</p>
            <p><strong>Email:</strong> ${newTeacher.email}</p>
            <p><strong>Fecha de registro:</strong> ${DateTime.fromISO(newTeacher.createdAt.toISOString()).toFormat(formatDateFrontend)}</p>
          </div>
          <p style="margin-bottom: 15px;">Por favor, revisa y aprueba la solicitud del profesor desde el panel de administración.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/auth/login" style="background-color: #4a6ee0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ir al Panel de Administración</a>
          </div>
          <p style="margin-bottom: 5px;">Saludos,</p>
          <p style="margin-bottom: 15px;">El equipo de Cyber Imperium</p>
        </div>
      </div>
    `;

    try {
      await this._mailerService.sendMail({
        to: adminEmails,
        subject: subject,
        html: htmlContent,
      });
      console.log(`Notificación enviada a ${adminEmails.length} administradores sobre el nuevo profesor: ${newTeacher.email}`);
    } catch (error) {
      console.error('Error al enviar notificación de nuevo profesor:', error);
    }
  }

  private async sendWelcomeEmailWithVerification(newUser: User) {
    // Generar token único
    const verificationToken = uuid();

    // Crear registro de verificación
    const emailVerification = new EmailVerification();
    emailVerification.email = newUser.email;
    emailVerification.token = verificationToken;
    emailVerification.used = false;
    emailVerification.user = newUser;

    await this._emailVerificationRepo.save(emailVerification);

    const frontendUrl = this._configService.get('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

    const subject = 'Bienvenido a Cyber Imperium - Verifica tu cuenta';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a6ee0;">¡Bienvenido a Cyber Imperium!</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <p style="margin-bottom: 15px;">Hola ${newUser.firstName} ${newUser.lastName},</p>
          <p style="margin-bottom: 15px;">¡Bienvenido a Cyber Imperium! Tu cuenta ha sido creada exitosamente.</p>
          <p style="margin-bottom: 15px;">Para completar tu registro y poder acceder a la plataforma, necesitas verificar tu dirección de email haciendo clic en el botón de abajo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4a6ee0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verificar mi cuenta</a>
          </div>
          <p style="margin-bottom: 15px;">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
          <p style="margin-bottom: 15px; word-break: break-all; background-color: white; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${verificationUrl}</p>
          <p style="margin-bottom: 15px;">Este enlace expirará en 24 horas por seguridad.</p>
          <p style="margin-bottom: 5px;">¡Estamos emocionados de tenerte en Cyber Imperium!</p>
          <p style="margin-bottom: 15px;">El equipo de Cyber Imperium</p>
        </div>
      </div>
    `;

    try {
      await this._mailerService.sendMail({
        to: newUser.email,
        subject: subject,
        html: htmlContent,
      });
      console.log(`Email de verificación enviado a ${newUser.email}`);
    } catch (error) {
      console.error('Error al enviar email de verificación:', error);
    }
  }

  async verifyEmail(token: string) {
    // Buscar el token de verificación
    const emailVerification = await this._emailVerificationRepo.findOne({
      where: { token, used: false },
      relations: ['user'],
    });

    if (!emailVerification) {
      throw new HttpException('Token de verificación inválido o expirado', HttpStatus.BAD_REQUEST);
    }

    // Verificar que no haya pasado más de 24 horas
    const tokenAge = DateTime.fromJSDate(emailVerification.createdAt).diffNow('hours').hours;
    if (Math.abs(tokenAge) > 24) {
      throw new HttpException('Token de verificación expirado', HttpStatus.BAD_REQUEST);
    }

    // Actualizar el usuario como verificado
    const user = emailVerification.user;
    user.isVerified = true;
    await this._userRepo.save(user);

    // Marcar el token como usado
    emailVerification.used = true;
    await this._emailVerificationRepo.save(emailVerification);

    return {
      statusCode: 200,
      message: 'Email verificado correctamente',
      data: {
        userId: user.id,
        email: user.email,
        isVerified: user.isVerified,
      },
    };
  }

  async searchUser(query: string) {
    const users = await this._userRepo
      .createQueryBuilder('user')
      .where('user.firstName ILIKE :query', { query: `%${query}%` })
      .orWhere('user.lastName ILIKE :query', { query: `%${query}%` })
      .orWhere('user.email ILIKE :query', { query: `%${query}%` })
      .limit(10)
      .getMany();

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      urlAvatar: user.urlAvatar
        ? user.urlAvatar
        : `https://ui-avatars.com/api/?name=${user.firstName?.split(' ')[0]}+${user.lastName?.split(' ')[0]}&background=1B802F&color=fff`,
    }));
  }

  async getTeachers() {
    const users = await this._userRepo.find({
      where: {
        typeUser: 'teacher',
      },
    });

    return users.map((user) => ({
      id: user.id,
      createdAt: DateTime.fromISO(user.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      urlAvatar: user.urlAvatar
        ? user.urlAvatar
        : `https://ui-avatars.com/api/?name=${user.firstName?.split(' ')[0]}+${user.lastName?.split(' ')[0]}&background=1B802F&color=fff`,
    }));
  }

  async approvedTeacher(id: number) {
    const user = await this.findById(id);
    user.approved = true;
    user.isVerified = true;
    await this._userRepo.save(user);
  }

  async approveUser(id: number) {
    const user = await this.findById(id);
    user.approved = true;
    await this._userRepo.save(user);
    
    return {
      id: user.id,
      approved: user.approved,
    };
  }

  async findById(id: number) {
    const user = await this._userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }
  
  async findAll(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedUsersResponseDto> {
    const skip = (page - 1) * limit;
    
    let queryBuilder = this._userRepo.createQueryBuilder('user');
    
    if (search) {
      queryBuilder = queryBuilder
        .where('user.firstName ILIKE :search', { search: `%${search}%` })
        .orWhere('user.lastName ILIKE :search', { search: `%${search}%` })
        .orWhere('user.email ILIKE :search', { search: `%${search}%` });
    }
    
    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('user.id', 'DESC')
      .getManyAndCount();
    
    return {
      users: users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        birthday: user.birthday,
        whatsApp: user.whatsApp,
        urlAvatar: user.urlAvatar
          ? user.urlAvatar
          : `https://ui-avatars.com/api/?name=${user.firstName?.split(' ')[0]}+${user.lastName?.split(' ')[0]}&background=1B802F&color=fff`,
        status: user.status,
        typeUser: user.typeUser,
        requiredUpdate: user.requiredUpdate,
        isVerified: user.isVerified,
        approved: user.approved,
      })),
      total,
      page,
      limit,
    };
  }
  
  async findOne(id: number) {
    const user = await this.findById(id);
    return {
      statusCode: 200,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        birthday: user.birthday ? DateTime.fromJSDate(user.birthday).toFormat(formatDateFrontend) : null,
        whatsApp: user.whatsApp,
        urlAvatar: user.urlAvatar
          ? user.urlAvatar
          : `https://ui-avatars.com/api/?name=${user.firstName?.split(' ')[0]}+${user.lastName?.split(' ')[0]}&background=1B802F&color=fff`,
        status: user.status,
        typeUser: user.typeUser,
        requiredUpdate: user.requiredUpdate,
      }
    };
  }

  // createUser crea un usuario en base al dto.
  async createUser(payload: CreateUserDto) {
    const user = new User();
    user.firstName = payload.firstName;
    user.lastName = payload.lastName;
    user.email = payload.email;
    
    // Generar URL del avatar automáticamente
    user.urlAvatar = `https://ui-avatars.com/api/?name=${payload.firstName}+${payload.lastName}&background=12BA82&color=fff`;
    
    // Manejo seguro de la fecha de nacimiento
    if (payload.birthday && payload.birthday.trim() !== '') {
      try {
        // Intentar parsear con el formato esperado
        const parsedDate = DateTime.fromFormat(payload.birthday, formatDateFrontend);
        
        // Verificar si la fecha es válida
        if (parsedDate.isValid) {
          user.birthday = parsedDate.toJSDate();
        } else {
          // Intentar con formato alternativo (dd/MM/yyyy)
          const altParsedDate = DateTime.fromFormat(payload.birthday, 'dd/MM/yyyy');
          if (altParsedDate.isValid) {
            user.birthday = altParsedDate.toJSDate();
          } else {
            // Si no se puede parsear, dejar como null
            user.birthday = null;
          }
        }
      } catch (error) {
        user.birthday = null;
      }
    } else {
      user.birthday = null;
    }
    
    user.password = payload.password;
    user.typeUser = payload.typeUser;
    user.isVerified = false;
    user.status = 'active';

    if (user.typeUser == 'admin' || user.typeUser == 'teacher') {
      user.approved = false;
    } else {
      user.approved = true;
    }

    //TODO: Encriptar la contraseña.

    try {
      await this._userRepo.save(user);

      // Enviar email de verificación al nuevo usuario
      await this.sendWelcomeEmailWithVerification(user);

      // Enviar notificación a administradores si es profesor
      if (user.typeUser === 'teacher') {
        await this.sendTeacherApprovalNotification(user);
      }
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El usuario ya existe');
      } else {
        throw new Error('No se pudo registrar el usuario');
      }
    }

    return {
      id: user.id,
    };
  }

  async updateUser(userId: number, payload: UserUpdateDto) {
    const user = await this.findById(userId);
    
    if (payload.firstName) {
      user.firstName = payload.firstName;
    }
    
    if (payload.lastName) {
      user.lastName = payload.lastName;
    }
    
    if (payload.birthday && payload.birthday.trim() !== '') {
      try {
        // Intentar parsear con el formato esperado
        const parsedDate = DateTime.fromFormat(payload.birthday, formatDateFrontend);
        
        // Verificar si la fecha es válida
        if (parsedDate.isValid) {
          user.birthday = parsedDate.toJSDate();
        } else {
          // Intentar con formato alternativo (dd/MM/yyyy)
          const altParsedDate = DateTime.fromFormat(payload.birthday, 'dd/MM/yyyy');
          if (altParsedDate.isValid) {
            user.birthday = altParsedDate.toJSDate();
          } else {
            // Si no se puede parsear, mantener la fecha actual
          }
        }
      } catch (error) {
      }
    }
    
    if (payload.whatsApp !== undefined) {
      user.whatsApp = payload.whatsApp;
    }
    
    if (payload.urlAvatar !== undefined) {
      user.urlAvatar = payload.urlAvatar;
    }

    await this._userRepo.save(user);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      birthday: user.birthday ? DateTime.fromJSDate(user.birthday).toFormat(formatDateFrontend) : null,
      whatsApp: user.whatsApp,
      urlAvatar: user.urlAvatar,
      status: user.status,
      typeUser: user.typeUser,
    };
  }
  
  async changeUserStatus(userId: number, status: string) {
    const user = await this.findById(userId);
    user.status = status;
    await this._userRepo.save(user);
    
    return {
      id: user.id,
      status: user.status,
    };
  }
  
  async resetUserPassword(userId: number, newPassword: string) {
    const user = await this.findById(userId);
    user.password = newPassword; // En un caso real, aquí se debería encriptar la contraseña
    await this._userRepo.save(user);
    
    return {
      id: user.id,
      message: 'Contraseña restablecida correctamente',
    };
  }
  
  async deleteUser(userId: number) {
    const user = await this.findById(userId);
    await this._userRepo.remove(user);
    
    return {
      id: userId,
      message: 'Usuario eliminado correctamente',
    };
  }

  async getLivesWithGems(userId: number) {
    const user = await this._userRepo.findOneBy({ id: userId });
    const result: LivesWithGemsDto = {
      lives: user.tumis,
      gems: user.yachay,
    };

    return result;
  }

  async getUserIndicators(userId: number) {
    const user = await this._userRepo.findOneBy({ id: userId });
    return {
      yachay: user.yachay,
      tumis: user.tumis,
      mullu: user.mullu,
    };
  }

  // Establecemos las vidas y los gemas.
  async setLivesWithGems(
    userId: number,
    payload: LivesWithGemsDto,
  ): Promise<LivesWithGemsDto> {
    const user = await this._userRepo.findOneBy({ id: userId });
    user.tumis = payload.lives;
    user.yachay = payload.gems;
    await this._userRepo.save(user);

    return {
      lives: user.tumis,
      gems: user.yachay,
    };
  }

  async updateUserIndicators(
    userId: number,
    payload: UserIndicatorsDto,
  ) {
    const user = await this._userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.yachay = payload.yachay;
    user.tumis = payload.tumis;
    user.mullu = payload.mullu;

    await this._userRepo.save(user);

    return {
      yachay: user.yachay,
      tumis: user.tumis,
      mullu: user.mullu,
    };
  }

  // Recupera la cantidad de seguidores de un usuario.
  async getFollowersCount(userId: number) {
    const result = await this._followersRepository
      .createQueryBuilder('followers')
      .where('followers.followedId = :id', { id: userId })
      .getCount();
    return result;
  }

  async getProfile(userId: number) {
    const user = await this._userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    // Cantidad de amigos.
    // puntos totales
    const score = await this._statisticsService.getScoreByUser(user.id);
    const followers = await this.getFollowersCount(user.id);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: DateTime.fromISO(user.createdAt.toISOString()).toISO(),
      birthday: DateTime.fromJSDate(user.birthday).toFormat(formatDateFrontend),
      whatsApp: user.whatsApp,
      urlAvatar: user.urlAvatar
        ? user.urlAvatar
        : `https://ui-avatars.com/api/?name=${user.firstName?.split(' ')[0]}+${user.lastName?.split(' ')[0]}&background=1B802F&color=fff`,
      email: user.email,
      followers,
      score: score,
      gem: user.yachay,
    };
  }
}
