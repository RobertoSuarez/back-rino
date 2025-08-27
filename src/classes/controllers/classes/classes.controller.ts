import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateClassDto,
  UpdateClassDto,
} from '../../../classes/dtos/classes.dtos';
import { ClassesService } from '../../../classes/services/classes/classes.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@ApiTags('classes')
@Controller('classes')
@UseGuards(AuthGuard)
export class ClassesController {
  constructor(private _classesService: ClassesService) {}

  @Get('my-classes/as-teacher')
  async getMyClassesAsTeacher(@Request() req) {
    const { id: userId } = req.user;
    return await this._classesService.getMyClassesAsTeacher(userId);
  }

  @Get('my-classes/as-student')
  async getMyClassesAsStudent(@Request() req) {
    const { id: userId } = req.user;
    return await this._classesService.getMyClassesAsStudent(userId);
  }

  @Get(':id/students')
  async getStudents(@Param('id', ParseIntPipe) classId: number) {
    return await this._classesService.getStudents(classId);
  }

  @Get(':id')
  async getClassById(@Param('id', ParseIntPipe) classId: number) {
    return await this._classesService.getClassById(classId);
  }

  @Post()
  async createClass(@Request() req, @Body() createClass: CreateClassDto) {
    const { id: userId } = req.user;
    return await this._classesService.createClass(userId, createClass);
  }

  @Put(':id')
  async updateClass(
    @Param('id', ParseIntPipe) classId: number,
    @Body() updateClass: UpdateClassDto,
  ) {
    return await this._classesService.updateClass(classId, updateClass);
  }

  @Post(':code/enroll')
  async enrollClass(@Request() req, @Param('code') code: string) {
    const { id: userId } = req.user;
    return await this._classesService.enrollClass(code, userId);
  }

  @Delete(':code/unenroll')
  async unenrollClass(@Request() req, @Param('code') code: string) {
    const { id: userId } = req.user;
    return await this._classesService.unenrollClass(code, userId);
  }

  @Delete(':id')
  async deleteClass(@Param('id', ParseIntPipe) classId: number) {
    return await this._classesService.deleteClass(classId);
  }
}
