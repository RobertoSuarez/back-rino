import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateUserDto,
  LivesWithGemsDto,
  UserUpdateDto,
} from '../../dtos/users.dtos';
import { User } from '../../../database/entities/user.entity';
import { Repository } from 'typeorm';
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

  findById(id: number) {
    const user = this._userRepo.findOneBy({ id });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // createUser crea un usuario en base al dto.
  async createUser(payload: CreateUserDto) {
    const user = new User();
    user.firstName = payload.firstName;
    user.lastName = payload.lastName;
    user.email = payload.email;
    user.birthday = DateTime.fromFormat(payload.birthday, formatDateFrontend, {
      zone: 'America/Guayaquil',
    }).toJSDate();
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
    const user = await this._userRepo.findOneBy({ id: userId });
    user.firstName = payload.firstName;
    user.lastName = payload.lastName;
    user.birthday = DateTime.fromFormat(payload.birthday, formatDateFrontend, {
      zone: 'America/Guayaquil',
    }).toJSDate();
    user.whatsApp = payload.whatsApp;
    user.urlAvatar = payload.urlAvatar;

    await this._userRepo.save(user);

    return {
      message: 'Usuario actualizado correctamente',
    };
  }

  async getLivesWithGems(userId: number) {
    const user = await this._userRepo.findOneBy({ id: userId });
    const result: LivesWithGemsDto = {
      lives: user.lives,
      gems: user.gems,
    };

    return result;
  }

  // Establecemos las vidas y los gemas.
  async setLivesWithGems(
    userId: number,
    payload: LivesWithGemsDto,
  ): Promise<LivesWithGemsDto> {
    const user = await this._userRepo.findOneBy({ id: userId });
    user.lives = payload.lives;
    user.gems = payload.gems;
    await this._userRepo.save(user);

    return {
      lives: user.lives,
      gems: user.gems,
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
      gem: user.gems,
    };
  }
}
