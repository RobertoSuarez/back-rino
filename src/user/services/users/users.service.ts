import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { formatDateFrontend } from '../../../common/constants';
import { StatisticsService } from '../../../statistics/service/statistics/statistics.service';
import { Followers } from '../../../database/entities/followers.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private _userRepo: Repository<User>,
    private _statisticsService: StatisticsService,
    @InjectRepository(Followers)
    private _followersRepository: Repository<Followers>,
  ) {}

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
    console.log('usuario actualizado: ', user);

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
