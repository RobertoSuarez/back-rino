import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
  CreateTemaDto,
  TemaDto,
  UpdateTemaDto,
} from '../../../course/dtos/tema.dtos';
import { TemaService } from '../../../course/services/tema/tema.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';
import { ChaptersGPTService } from 'src/openai/services/chapters/chaptersGPT.service';

@Controller('tema')
@UseGuards(AuthGuard)
export class TemaController {
  constructor(
    private _temaService: TemaService,
    private _chaptersGPTService: ChaptersGPTService,
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

  @Delete(':id')
  async deleteTema(@Param('id', ParseIntPipe) temaId: number) {
    await this._temaService.deleteTema(temaId);
  }
}
