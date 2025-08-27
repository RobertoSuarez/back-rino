import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from '../../../community/services/friends/friends.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private _friendsService: FriendsService) {}

  @Get('/followers')
  async getFollowers(@Request() req) {
    const { id: userId } = req.user;
    return await this._friendsService.getFollowers(userId);
  }
  @Get('/followed')
  async getFollowed(@Request() req) {
    const { id: userId } = req.user;
    return await this._friendsService.getFollowed(userId);
  }

  @Post(':id/follow')
  async follow(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const { id: userId } = req.user;
    return await this._friendsService.follower(userId, id);
  }

  @Get(':id/status')
  async status(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const { id: userId } = req.user;
    return await this._friendsService.status(userId, id);
  }
}
