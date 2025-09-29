import {
  Body,
  Controller,
  Delete,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CoursesService } from '../../../course/services/courses/courses.service';
import {
  CreateUserDto,
  LivesWithGemsDto,
  UserUpdateDto,
  ChangeUserStatusDto,
  ResetPasswordDto,
  UserIndicatorsDto,
} from '../../../user/dtos/users.dtos';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';
import { UsersService } from '../../../user/services/users/users.service';
import { RolesGuard } from '../../../user/guards/roles/roles.guard';
import { Roles } from '../../../user/decorators/roles.decorator';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(
    private _usersService: UsersService,
    private courseService: CoursesService,
  ) {}

  @Get('indicators')
  @UseGuards(AuthGuard)
  async getUserIndicators(@Request() req) {
    const indicators = await this._usersService.getUserIndicators(req.user.id);
    return indicators;
  }

  @Patch('indicators')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Actualiza los indicadores (yachay, tumis, mullu) del usuario actual' })
  async updateUserIndicators(
    @Request() req,
    @Body() payload: UserIndicatorsDto,
  ) {
    console.log('info para actualizar: ', req.user.id, payload);
    const indicators = await this._usersService.updateUserIndicators(req.user.id, payload);
    return indicators;
  }

  @Get('search')
  @ApiOperation({ summary: 'Busca usuarios por nombre, apellido o email' })
  @ApiQuery({ name: 'query', required: true, description: 'Término de búsqueda' })
  async searchUsers(@Query('query') query: string) {
    return await this._usersService.searchUser(query);
  }
  
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Recupera todos los usuarios con paginación' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Término de búsqueda opcional' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return await this._usersService.findAll(page, limit, search);
  }
  
  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Obtiene un usuario por su ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this._usersService.findOne(id);
  }

  @Get('teacher-list')
  async getTeachers() {
    return await this._usersService.getTeachers();
  }

  @Patch('teacher/:id/approved')
  async approvedTeacher(@Param('id', ParseIntPipe) id: number) {
    return await this._usersService.approvedTeacher(id);
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Aprueba un usuario (cambia approved a true)' })
  async approveUser(@Param('id', ParseIntPipe) id: number) {
    return {
      statusCode: 200,
      message: 'Usuario aprobado correctamente',
      data: await this._usersService.approveUser(id)
    };
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verifica el email del usuario usando un token' })
  async verifyEmail(@Body('token') token: string) {
    return await this._usersService.verifyEmail(token);
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
      return {
        statusCode: 201,
        message: 'Usuario creado correctamente',
        data: response
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtiene las vidas y los gemas del usuario' })
  @Get('lives-with-gems')
  async getLives(@Request() req) {
    const id = parseInt(req.user.id, 10);
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

  @Put('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Actualiza el perfil del usuario actual' })
  async updateProfile(@Request() req, @Body() payload: UserUpdateDto) {
    const { id: userId } = req.user;
    return {
      statusCode: 200,
      message: 'Perfil actualizado correctamente',
      data: await this._usersService.updateUser(userId, payload)
    };
  }
  
  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Actualiza un usuario por su ID' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UserUpdateDto
  ) {
    return {
      statusCode: 200,
      message: 'Usuario actualizado correctamente',
      data: await this._usersService.updateUser(id, payload)
    };
  }
  
  @Put(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Cambia el estado de un usuario (activar/desactivar)' })
  async changeUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ChangeUserStatusDto
  ) {
    return {
      statusCode: 200,
      message: `Usuario ${payload.status === 'active' ? 'activado' : 'desactivado'} correctamente`,
      data: await this._usersService.changeUserStatus(id, payload.status)
    };
  }
  
  @Put(':id/reset-password')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Restablece la contraseña de un usuario' })
  async resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ResetPasswordDto
  ) {
    return {
      statusCode: 200,
      message: 'Contraseña restablecida correctamente',
      data: await this._usersService.resetUserPassword(id, payload.newPassword)
    };
  }
  
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Elimina un usuario' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return {
      statusCode: 200,
      message: 'Usuario eliminado correctamente',
      data: await this._usersService.deleteUser(id)
    };
  }
}
