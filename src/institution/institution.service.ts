import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../database/entities/institution.entity';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { InstitutionDto } from './dto/institution.dto';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
  ) {}

  async create(createInstitutionDto: CreateInstitutionDto): Promise<InstitutionDto> {
    const institution = this.institutionRepository.create(createInstitutionDto);
    const savedInstitution = await this.institutionRepository.save(institution);
    return this.mapToDto(savedInstitution);
  }

  async findAll(): Promise<InstitutionDto[]> {
    const institutions = await this.institutionRepository.find({
      relations: ['users'],
      order: { name: 'ASC' },
    });

    return institutions.map(institution => ({
      ...this.mapToDto(institution),
      userCount: institution.users?.length || 0,
    }));
  }

  async findOne(id: number): Promise<InstitutionDto> {
    const institution = await this.institutionRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!institution) {
      throw new NotFoundException(`Institución con ID ${id} no encontrada`);
    }

    return {
      ...this.mapToDto(institution),
      userCount: institution.users?.length || 0,
    };
  }

  async update(id: number, updateInstitutionDto: UpdateInstitutionDto): Promise<InstitutionDto> {
    const institution = await this.institutionRepository.findOne({ where: { id } });

    if (!institution) {
      throw new NotFoundException(`Institución con ID ${id} no encontrada`);
    }

    Object.assign(institution, updateInstitutionDto);
    const updatedInstitution = await this.institutionRepository.save(institution);
    return this.mapToDto(updatedInstitution);
  }

  async remove(id: number): Promise<void> {
    const institution = await this.institutionRepository.findOne({ where: { id } });

    if (!institution) {
      throw new NotFoundException(`Institución con ID ${id} no encontrada`);
    }

    await this.institutionRepository.remove(institution);
  }

  private mapToDto(institution: Institution): InstitutionDto {
    return {
      id: institution.id,
      name: institution.name,
      description: institution.description,
      logoUrl: institution.logoUrl,
      status: institution.status,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
    };
  }
}
