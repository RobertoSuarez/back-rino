import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CoursesService } from '../../../course/services/courses/courses.service';
import {
  CreateUserDto,
  LivesWithGemsDto,
  UserUpdateDto,
} from '../../../user/dtos/users.dtos';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';
import { UsersService } from '../../../user/services/users/users.service';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(
    private _usersService: UsersService,
    private courseService: CoursesService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Recupera todos los usuarios' })
  async findAll(@Query('query') query: string) {
    return await this._usersService.searchUser(query);
  }

  @Get('teacher-list')
  async getTeachers() {
    return await this._usersService.getTeachers();
  }

  @Patch('teacher/:id/approved')
  async approvedTeacher(@Param('id', ParseIntPipe) id: number) {
    return await this._usersService.approvedTeacher(id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/profile')
  @ApiOperation({ summary: 'Obtiene el perfil del usuario, en base al token' })
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this._usersService.getProfile(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registra un nuevo usuario' })
  async createUser(@Body() payload: CreateUserDto) {
    try {
      const response = await this._usersService.createUser(payload);
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtiene las vidas y los gemas del usuario' })
  @Get('lives-with-gems')
  async getLives(@Request() req) {
    const { id } = req.user;
    const result = await this._usersService.getLivesWithGems(id);
    return result;
  }

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Vidas y gemas del usuario loggeado',
    type: LivesWithGemsDto,
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Establece las vidas y los gemas del usuario' })
  @Post('lives-with-gems')
  async setLivesWithGems(@Request() req, @Body() payload: LivesWithGemsDto) {
    const { id } = req.user;
    const result = await this._usersService.setLivesWithGems(id, payload);
    return result;
  }

  @Put()
  @UseGuards(AuthGuard)
  async updateUser(@Request() req, @Body() payload: UserUpdateDto) {
    const { id: userId } = req.user;

    return this._usersService.updateUser(userId, payload);
  }
}
