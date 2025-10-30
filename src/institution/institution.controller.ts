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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InstitutionService } from './institution.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { AuthGuard } from '../user/guards/auth/auth.guard';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { Roles } from '../user/decorators/roles.decorator';
import { GenerateImageService } from '../openai/services/generate-image/generate-image.service';

@ApiTags('Instituciones')
@Controller('institutions')
export class InstitutionController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly generateImageService: GenerateImageService,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva institución (solo admin)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Institución creada exitosamente' })
  async create(@Body() createInstitutionDto: CreateInstitutionDto) {
    const institution = await this.institutionService.create(createInstitutionDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Institución creada exitosamente',
      data: institution,
    };
  }

  @Post('upload-image')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir imagen de logo para institución (solo admin)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.generateImageService.uploadImage(file);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Imagen subida exitosamente',
      data: { url },
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las instituciones' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de instituciones' })
  async findAll() {
    const institutions = await this.institutionService.findAll();
    return {
      statusCode: HttpStatus.OK,
      data: institutions,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener una institución por ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Institución encontrada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Institución no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const institution = await this.institutionService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      data: institution,
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una institución (solo admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Institución actualizada exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Institución no encontrada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
  ) {
    const institution = await this.institutionService.update(id, updateInstitutionDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Institución actualizada exitosamente',
      data: institution,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una institución (solo admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Institución eliminada exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Institución no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.institutionService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Institución eliminada exitosamente',
    };
  }
}
