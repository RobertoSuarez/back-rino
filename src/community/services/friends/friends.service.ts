import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';
import { Followers } from '../../../database/entities/followers.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Followers)
    private _followersRepository: Repository<Followers>,
  ) {}
  // Crea un registro para que un usuario siga a otro usuario.
  async follower(followerId: number, followedId: number) {
    // seguidor = follower
    // seguido = followed
    if (followedId === followerId) {
      throw new Error('No puedes seguirte a ti mismo');
    }
    const followerObj = await this._followersRepository.findOneBy({
      follower: { id: followerId },
      followed: { id: followedId },
    });
    // si ya existe el registro de que un usuario sigue a otro usuario lanza un error
    if (followerObj) {
      throw new Error('Ya sigues a este usuario');
    } else {
      await this._followersRepository.save({
        follower: { id: followerId },
        followed: { id: followedId },
      });
    }
  }

  async status(followerId: number, followedId: number) {
    const followerObj = await this._followersRepository.findOneBy({
      follower: { id: followerId },
      followed: { id: followedId },
    });
    if (followerObj) {
      return {
        following: true,
        from: DateTime.fromISO(followerObj.createdAt.toISOString()).toFormat(
          formatDateFrontend,
        ),
      };
    } else {
      return {
        following: false,
        from: null,
      };
    }
  }

  // Recupera todos los seguidores de un usuario.
  async getFollowers(userId: number) {
    const result = await this._followersRepository
      .createQueryBuilder('followers')
      .where('followers.followedId = :id', { id: userId })
      .leftJoinAndSelect('followers.follower', 'user')
      .getMany();

    return result.map((r) => ({
      id: r.follower.id,
      from: DateTime.fromISO(r.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      firstName: r.follower.firstName,
      lastName: r.follower.lastName,
      url: r.follower.urlAvatar
        ? r.follower.urlAvatar
        : `https://ui-avatars.com/api/?name=${r.follower.firstName?.split(' ')[0]}+${r.follower.lastName?.split(' ')[0]}&background=1B802F&color=fff`,
      email: r.follower.email,
    }));
  }

  // Recupera todos los usuario al que el usuario actualmente sigue.
  async getFollowed(userId: number) {
    const result = await this._followersRepository
      .createQueryBuilder('followers')
      .where('followers.followerId = :id', { id: userId })
      .leftJoinAndSelect('followers.followed', 'user')
      .getMany();
    return result.map((r) => ({
      id: r.followed.id,
      from: DateTime.fromISO(r.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      firstName: r.followed.firstName,
      lastName: r.followed.lastName,
      url: r.followed.urlAvatar
        ? r.followed.urlAvatar
        : `https://ui-avatars.com/api/?name=${r.followed.firstName?.split(' ')[0]}+${r.followed.lastName?.split(' ')[0]}&background=1B802F&color=fff`,
      email: r.followed.email,
    }));
  }
}
