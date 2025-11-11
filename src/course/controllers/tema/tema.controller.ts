import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToClass } from 'class-transformer';
import {
  CreateTemaDto,
  TemaDto,
  UpdateTemaDto,
} from '../../../course/dtos/tema.dtos';
import { TemaService } from '../../../course/services/tema/tema.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';
import { ChaptersGPTService } from 'src/openai/services/chapters/chaptersGPT.service';
import { GenerateImageService } from 'src/openai/services/generate-image/generate-image.service';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';

@Controller('tema')
@UseGuards(AuthGuard)
export class TemaController {
  constructor(
    private _temaService: TemaService,
    private _chaptersGPTService: ChaptersGPTService,
    private _generateImageService: GenerateImageService,
  ) {}

  @Get()
  async findTemasByChapterId(@Query('chapterId') chapterId: number) {
    const result = this._temaService.findByChapterId(chapterId);
    return result;
  }

  @Get(':id')
  async getTemaById(@Param('id', ParseIntPipe) temaId: number) {
    return await this._temaService.findTemaById(temaId);
  }

  @Get(':id/theory')
  async getTheory(@Param('id', ParseIntPipe) temaId: number) {
    const result = await this._temaService.findTheoryByTemaId(temaId);
    return {
      theory: result,
    };
  }

  @Post('generate-tema-openai')
  async generateTema(@Body() payload: any) {
    return this._chaptersGPTService.getTemas(payload.prompt);
  }

  @Post()
  async createTema(@Body() payload: CreateTemaDto) {
    const result = this._temaService.createTema(payload);
    return plainToClass(TemaDto, result, { excludeExtraneousValues: true });
  }

  @Post('multiple')
  async createTemasMultiple(
    @Body() payload: CreateTemaDto[],
    @Query('chapterId', ParseIntPipe) chapterId: number,
  ) {
    return this._temaService.registerMultipleTema(payload, chapterId);
  }

  @Patch(':id')
  async updateTema(
    @Param('id', ParseIntPipe) temaId: number,
    @Body() payload: UpdateTemaDto,
  ) {
    const result = await this._temaService.updateTema(temaId, payload);
    return plainToClass(TemaDto, result, { excludeExtraneousValues: true });
  }

  @Post('upload-image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir imagen de fondo para tema' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this._generateImageService.uploadImage(file);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Imagen subida exitosamente',
      data: { url },
    };
  }

  @Delete(':id')
  async deleteTema(@Param('id', ParseIntPipe) temaId: number) {
    await this._temaService.deleteTema(temaId);
  }
}
