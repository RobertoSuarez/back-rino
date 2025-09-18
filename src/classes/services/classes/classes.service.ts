import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { v4 as uuid } from 'uuid';

import {
  CreateClassDto,
  UpdateClassDto,
} from '../../../classes/dtos/classes.dtos';
import { Classes } from '../../../database/entities/classes.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { Matricula } from '../../../database/entities/matricula.entity';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Classes) private _classesRepository: Repository<Classes>,
    @InjectRepository(User) private _userRepository: Repository<User>,
    @InjectRepository(Matricula)
    private _matriculaRepository: Repository<Matricula>,
  ) {}

  async getMyClassesAsTeacher(userId: number) {
    const user = await this._userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    const classes = await this._classesRepository.find({
      where: { teacher: { id: user.id } },
    });
    return classes.map((c) => {
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        academicPeriod: c.academicPeriod,
        level: c.level,
        paralelo: c.paralelo,
        carrera: c.carrera,
        description: c.description,
        isPublic: c.isPublic,
        createAt: DateTime.fromISO(c.createdAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      };
    });
  }

  async getMyClassesAsStudent(userId: number) {
    const user = await this._userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // en que clases esta matriculado el usuario.
    const matriculas = await this._matriculaRepository.find({
      where: {
        student: { id: user.id },
        class: { id: Not(IsNull()) },
      },
      relations: ['student', 'class'],
    });

    const classes = await this._classesRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.teacher', 'teacher')
      .where('class.id IN (:...ids)', {
        ids: matriculas.map((m) => m.class.id),
      })
      .getMany();
    // const classes = await this._matriculaRepository
    //   .createQueryBuilder('matricula')
    //   .leftJoinAndSelect('matricula.class', 'class')
    //   .leftJoinAndSelect('class.teacher', 'teacher')
    //   .where('matricula.studentId = :studentId', { studentId: user.id })
    //   .getMany();
    return classes.map((c) => {
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        academicPeriod: c.academicPeriod,
        level: c.level,
        paralelo: c.paralelo,
        carrera: c.carrera,
        description: c.description,
        isPublic: c.isPublic,
        teacher: {
          id: c.teacher.id,
          firstName: c.teacher.firstName,
          lastName: c.teacher.lastName,
          email: c.teacher.email,
        },
      };
    });
  }

  async createClass(userId: number, createClass: CreateClassDto) {
    const teacher = await this._userRepository.findOneBy({ id: userId });
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    if (teacher.typeUser !== 'teacher') {
      throw new Error('Only teachers can create classes');
    }
    const createClassInstance = plainToClass(Classes, createClass);

    createClassInstance.code = uuid().slice(0, 6);
    createClassInstance.teacher = teacher;
    const createdClass =
      await this._classesRepository.save(createClassInstance);
    return {
      id: createdClass.id,
      code: createdClass.code,
      name: createdClass.name,
      academicPeriod: createdClass.academicPeriod,
      level: createdClass.level,
      paralelo: createdClass.paralelo,
      carrera: createdClass.carrera,
      description: createdClass.description,
      isPublic: createdClass.isPublic,
      createAt: DateTime.fromISO(createdClass.createdAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      updatedAt: DateTime.fromISO(createdClass.updatedAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      teacher: {
        id: createdClass.teacher.id,
        firstName: createdClass.teacher.firstName,
        lastName: createdClass.teacher.lastName,
        email: createdClass.teacher.email,
        role: createdClass.teacher.typeUser,
      },
    };
  }

  async updateClass(classId: number, updateClass: UpdateClassDto) {
    const updatedClass = await this._classesRepository.findOneBy({
      id: classId,
    });
    if (!updatedClass) {
      throw new Error('No existe la clase');
    }

    updatedClass.name = updateClass.name;
    updatedClass.academicPeriod = updateClass.academicPeriod;
    updatedClass.level = updateClass.level;
    updatedClass.paralelo = updateClass.paralelo;
    updatedClass.carrera = updateClass.carrera;
    updatedClass.description = updateClass.description;
    updatedClass.isPublic = updateClass.isPublic;

    await this._classesRepository.save(updatedClass);
  }

  async deleteClass(classId: number) {
    await this._classesRepository.softDelete({ id: classId });
  }

  async enrollClass(code: string, userId: number) {
    // Recuperamos el usuario
    const user = await this._userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('No existe el usuario');
    }
    // Recuperamos la clase.
    const classEnrolled = await this._classesRepository.findOneBy({
      code: code,
    });
    if (!classEnrolled) {
      throw new Error('No existe la clase');
    }

    // Validamos que la clase no sea publica.
    if (!classEnrolled.isPublic) {
      throw new Error('La clase no es publica');
    }

    // Validar si el usuario ya esta matriculado
    const matriculado = await this._matriculaRepository.findOneBy({
      student: { id: user.id },
      class: { id: classEnrolled.id },
    });
    if (matriculado) {
      throw new Error('El usuario ya se encuentra matriculado en la clase');
    }

    const matricula = new Matricula();
    matricula.student = user;
    matricula.class = classEnrolled;

    const result = await this._matriculaRepository.save(matricula);

    return {
      id: result.id,
    };
  }

  async unenrollClass(code: string, userId: number) {
    const user = await this._userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('No existe el usuario');
    }

    const classEnrolled = await this._classesRepository.findOneBy({
      code: code,
    });
    if (!classEnrolled) {
      throw new Error('No existe la clase');
    }

    const matriculado = await this._matriculaRepository.findOneBy({
      student: { id: user.id },
      class: { id: classEnrolled.id },
    });
    if (!matriculado) {
      throw new Error('El usuario no se encuentra matriculado en la clase');
    }

    await this._matriculaRepository.softDelete({ id: matriculado.id });
  }

  async getClassById(classId: number) {
    const classInstance = await this._classesRepository.findOne({
      where: {
        id: classId,
      },
      relations: ['teacher'],
    });

    if (!classInstance) {
      throw new Error('No existe la clase');
    }

    return {
      id: classInstance.id,
      code: classInstance.code,
      name: classInstance.name,
      academicPeriod: classInstance.academicPeriod,
      level: classInstance.level,
      paralelo: classInstance.paralelo,
      carrera: classInstance.carrera,
      description: classInstance.description,
      isPublic: classInstance.isPublic,
      teacher: {
        id: classInstance.teacher.id,
        firstName: classInstance.teacher.firstName,
        lastName: classInstance.teacher.lastName,
        email: classInstance.teacher.email,
      },
    };
  }

  async getStudents(classId: number) {
    const students = await this._matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.student', 'student')
      .where('matricula.classId = :classId', { classId });
    const result = await students.getMany();
    return result.map((m) => {
      return {
        matriculaId: m.id,
        dateEnrolled: DateTime.fromISO(m.createdAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
        student: {
          id: m.student.id,
          firstName: m.student.firstName,
          lastName: m.student.lastName,
          email: m.student.email,
          phone: m.student.whatsApp,
        },
      };
    });
  }
}
