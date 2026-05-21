import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { LearningPath } from '../../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../../database/entities/learningPathSubscription.entity';
import { LearningPathGrade } from '../../database/entities/learning-path-grade.entity';
import { ActivityProgressUser } from '../../database/entities/activityProgress.entity';
import { User } from '../../database/entities/user.entity';
import { UpsertGradeDto, BulkGradeDto } from '../dtos/grade-book.dto';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../common/constants';

@Injectable()
export class TeacherGradebookService {
  constructor(
    @InjectRepository(LearningPath)
    private pathRepo: Repository<LearningPath>,
    @InjectRepository(LearningPathSubscription)
    private subscriptionRepo: Repository<LearningPathSubscription>,
    @InjectRepository(LearningPathGrade)
    private gradeRepo: Repository<LearningPathGrade>,
    @InjectRepository(ActivityProgressUser)
    private progressRepo: Repository<ActivityProgressUser>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── 1. Lista de rutas del profesor con stats de notas ───────────────────
  async getTeacherPaths(teacherId: number): Promise<any[]> {
    const paths = await this.pathRepo.find({
      where: { createdBy: { id: teacherId }, deletedAt: IsNull() },
      relations: ['subscriptions', 'subscriptions.student'],
      order: { id: 'DESC' },
    });

    return Promise.all(
      paths.map(async (path) => {
        const activeSubs = (path.subscriptions || []).filter((s) => !s.deletedAt);
        const grades = await this.gradeRepo.find({
          where: { subscription: { learningPath: { id: path.id } } },
          relations: ['subscription'],
        });

        const graded = grades.filter((g) => g.finalGrade !== null && g.finalGrade !== undefined);
        const avgFinal = graded.length > 0
          ? parseFloat((graded.reduce((s, g) => s + g.finalGrade, 0) / graded.length).toFixed(2))
          : null;

        return {
          id: path.id,
          name: path.name,
          code: path.code,
          description: path.description,
          studentsCount: activeSubs.length,
          gradedCount: graded.length,
          pendingCount: activeSubs.length - graded.length,
          avgFinalGrade: avgFinal,
          isFullyGraded: graded.length >= activeSubs.length && activeSubs.length > 0,
        };
      }),
    );
  }

  // ─── 2. Estudiantes de una ruta con nota sugerida y final ────────────────
  async getPathGrades(pathId: number, teacherId: number): Promise<any> {
    const path = await this.pathRepo.findOne({
      where: { id: pathId, createdBy: { id: teacherId }, deletedAt: IsNull() },
    });
    if (!path) throw new ForbiddenException('Ruta no encontrada o no tienes acceso');

    const subscriptions = await this.subscriptionRepo.find({
      where: { learningPath: { id: pathId }, deletedAt: IsNull() },
      relations: ['student', 'learningPath'],
      order: { subscribedAt: 'DESC' },
    });

    // Obtener notas ya guardadas
    const existingGrades = await this.gradeRepo.find({
      where: { subscription: { learningPath: { id: pathId } } },
      relations: ['subscription', 'gradedBy'],
    });
    const gradeMap = new Map(existingGrades.map((g) => [g.subscription.id, g]));

    // IDs de actividades de la ruta (para calcular nota sugerida)
    const pathActivityIds = await this.getPathActivityIds(pathId);
    const totalActivities = pathActivityIds.length;

    const studentsData = await Promise.all(
      subscriptions.map(async (sub) => {
        const grade = gradeMap.get(sub.id);
        const suggestedGrade = await this.calculateSuggestedGrade(
          sub.student.id,
          pathActivityIds,
          totalActivities,
        );

        const finalGrade = grade?.finalGrade ?? null;
        const status =
          finalGrade === null
            ? 'not_graded'
            : finalGrade >= 6
            ? 'approved'
            : 'failed';

        return {
          subscriptionId: sub.id,
          gradeId: grade?.id ?? null,
          student: {
            id: sub.student.id,
            firstName: sub.student.firstName,
            lastName: sub.student.lastName,
            email: sub.student.email,
            urlAvatar: sub.student.urlAvatar,
          },
          subscribedAt: DateTime.fromISO(sub.subscribedAt.toISOString()).toFormat(formatDateFrontend),
          suggestedGrade,
          finalGrade,
          observations: grade?.observations ?? null,
          gradedAt: grade?.gradedAt
            ? DateTime.fromISO(grade.gradedAt.toISOString()).toFormat(formatDateFrontend)
            : null,
          gradedBy: grade?.gradedBy
            ? `${grade.gradedBy.firstName} ${grade.gradedBy.lastName}`
            : null,
          status,
        };
      }),
    );

    // Estadísticas de la ruta
    const graded = studentsData.filter((s) => s.finalGrade !== null);
    const stats = this.buildStats(graded.map((s) => s.finalGrade));

    return {
      path: { id: path.id, name: path.name, code: path.code },
      totalStudents: subscriptions.length,
      gradedStudents: graded.length,
      stats,
      students: studentsData,
    };
  }

  // ─── 3. Calcular y guardar notas sugeridas masivas ───────────────────────
  async bulkCalculateSuggestedGrades(pathId: number, teacherId: number): Promise<any> {
    const path = await this.pathRepo.findOne({
      where: { id: pathId, createdBy: { id: teacherId }, deletedAt: IsNull() },
    });
    if (!path) throw new ForbiddenException('Ruta no encontrada');

    const subscriptions = await this.subscriptionRepo.find({
      where: { learningPath: { id: pathId }, deletedAt: IsNull() },
      relations: ['student'],
    });

    const pathActivityIds = await this.getPathActivityIds(pathId);
    const totalActivities = pathActivityIds.length;

    let updated = 0;
    for (const sub of subscriptions) {
      const suggested = await this.calculateSuggestedGrade(
        sub.student.id,
        pathActivityIds,
        totalActivities,
      );

      let grade = await this.gradeRepo.findOne({ where: { subscription: { id: sub.id } } });
      if (!grade) {
        grade = this.gradeRepo.create({ subscription: sub });
      }
      grade.suggestedGrade = suggested;
      await this.gradeRepo.save(grade);
      updated++;
    }

    return { updated, totalStudents: subscriptions.length };
  }

  // ─── 4. Upsert de nota final (una sola) ─────────────────────────────────
  async upsertGrade(dto: UpsertGradeDto, teacherId: number): Promise<any> {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: dto.subscriptionId },
      relations: ['learningPath', 'learningPath.createdBy'],
    });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');
    if (sub.learningPath.createdBy.id !== teacherId)
      throw new ForbiddenException('No tienes acceso a esta suscripción');

    let grade = await this.gradeRepo.findOne({ where: { subscription: { id: sub.id } } });
    if (!grade) grade = this.gradeRepo.create({ subscription: sub });

    grade.finalGrade = dto.finalGrade;
    grade.observations = dto.observations ?? grade.observations;
    grade.gradedAt = new Date();
    grade.gradedBy = await this.userRepo.findOneBy({ id: teacherId });

    return this.gradeRepo.save(grade);
  }

  // ─── 5. Bulk guardar notas finales ──────────────────────────────────────
  async bulkSaveGrades(dto: BulkGradeDto, teacherId: number): Promise<any> {
    if (!Array.isArray(dto.grades)) {
      // Opcional: lanzar error o retornar vacío
      return { saved: 0, message: 'No grades array provided' };
    }
    const results = await Promise.all(
      dto.grades.map((g) => this.upsertGrade(g, teacherId)),
    );
    return { saved: results.length };
  }

  // ─── 6. Estadísticas de la ruta ─────────────────────────────────────────
  async getPathStats(pathId: number, teacherId: number): Promise<any> {
    const result = await this.getPathGrades(pathId, teacherId);
    return result.stats;
  }

  // ─── 7. Reporte PDF (pdfmake) ────────────────────────────────────────────
  async generatePdfReport(pathId: number, teacherId: number): Promise<Buffer> {
    const data = await this.getPathGrades(pathId, teacherId);
    // Importación dinámica para evitar problemas de SSR
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfmake = require('pdfmake');
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Medium.ttf',
        italic: 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Italic.ttf',
        bolditalic: 'node_modules/pdfmake/build/fonts/Roboto/Roboto-MediumItalic.ttf',
      },
    };

    pdfmake.setFonts(fonts);

    const tableBody = [
      [
        { text: '#', bold: true, fillColor: '#1cb0f6', color: 'white' },
        { text: 'Estudiante', bold: true, fillColor: '#1cb0f6', color: 'white' },
        { text: 'Email', bold: true, fillColor: '#1cb0f6', color: 'white' },
        { text: 'Nota Sug.', bold: true, fillColor: '#1cb0f6', color: 'white' },
        { text: 'Nota Final', bold: true, fillColor: '#1cb0f6', color: 'white' },
        { text: 'Estado', bold: true, fillColor: '#1cb0f6', color: 'white' },
      ],
      ...data.students.map((s: any, i: number) => [
        { text: String(i + 1), alignment: 'center' },
        { text: `${s.student.firstName} ${s.student.lastName}` },
        { text: s.student.email, fontSize: 9 },
        { text: s.suggestedGrade !== null ? String(s.suggestedGrade) : '—', alignment: 'center' },
        {
          text: s.finalGrade !== null ? String(s.finalGrade) : '—',
          alignment: 'center',
          bold: true,
          color: s.finalGrade === null ? '#afafaf' : s.finalGrade >= 6 ? '#46a302' : '#ff4b4b',
        },
        {
          text: s.status === 'approved' ? '✓ Aprobado' : s.status === 'failed' ? '✗ Reprobado' : '— Pendiente',
          alignment: 'center',
          color: s.status === 'approved' ? '#46a302' : s.status === 'failed' ? '#ff4b4b' : '#afafaf',
        },
      ]),
    ];

    const docDefinition: any = {
      pageMargins: [40, 60, 40, 60],
      content: [
        {
          text: 'CYBER IMPERIUM',
          style: 'brand',
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          text: 'Libro de Calificaciones',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 16],
        },
        {
          columns: [
            { text: [{ text: 'Ruta: ', bold: true }, data.path.name] },
            { text: [{ text: 'Código: ', bold: true }, data.path.code], alignment: 'right' },
          ],
          margin: [0, 0, 0, 4],
        },
        {
          columns: [
            { text: [{ text: 'Total estudiantes: ', bold: true }, String(data.totalStudents)] },
            {
              text: [{ text: 'Generado: ', bold: true }, DateTime.now().toFormat(formatDateFrontend)],
              alignment: 'right',
            },
          ],
          margin: [0, 0, 0, 16],
        },
        {
          table: { headerRows: 1, widths: [30, '*', '*', 55, 55, 70], body: tableBody },
          layout: 'lightHorizontalLines',
        },
        { text: '', margin: [0, 16, 0, 0] },
        // Resumen
        {
          columns: [
            { text: [{ text: 'Promedio: ', bold: true }, String(data.stats.average ?? '—')] },
            { text: [{ text: 'Nota máx: ', bold: true }, String(data.stats.max ?? '—')] },
            { text: [{ text: 'Nota mín: ', bold: true }, String(data.stats.min ?? '—')] },
            {
              text: [{ text: '% Aprobados: ', bold: true }, String(data.stats.passRate ?? 0) + '%'],
            },
          ],
          style: 'summary',
        },
      ],
      styles: {
        brand: { fontSize: 18, bold: true, color: '#1cb0f6' },
        title: { fontSize: 14, bold: true, color: '#3c3c3c' },
        summary: { fontSize: 10, color: '#555', margin: [0, 8, 0, 0] },
      },
      defaultStyle: { fontSize: 10, color: '#3c3c3c' },
    };

    return await pdfmake.createPdf(docDefinition).getBuffer();
  }

  // ─── 8. Reporte Excel (exceljs) ─────────────────────────────────────────
  async generateExcelReport(pathId: number, teacherId: number): Promise<Buffer> {
    const data = await this.getPathGrades(pathId, teacherId);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // ── Hoja 1: Calificaciones ──
    const sheet = workbook.addWorksheet('Calificaciones');
    sheet.columns = [
      { header: '#', key: 'num', width: 5 },
      { header: 'Estudiante', key: 'name', width: 28 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Suscrito el', key: 'sub', width: 16 },
      { header: 'Nota Sugerida', key: 'suggested', width: 16 },
      { header: 'Nota Final', key: 'final', width: 14 },
      { header: 'Observaciones', key: 'obs', width: 30 },
      { header: 'Estado', key: 'status', width: 14 },
    ];

    // Estilo de cabecera
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1CB0F6' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center' };
    });

    data.students.forEach((s: any, i: number) => {
      const row = sheet.addRow({
        num: i + 1,
        name: `${s.student.firstName} ${s.student.lastName}`,
        email: s.student.email,
        sub: s.subscribedAt,
        suggested: s.suggestedGrade ?? '—',
        final: s.finalGrade ?? '—',
        obs: s.observations ?? '',
        status: s.status === 'approved' ? 'Aprobado' : s.status === 'failed' ? 'Reprobado' : 'Pendiente',
      });

      // Color condicional en Nota Final
      const finalCell = row.getCell('final');
      if (s.finalGrade !== null) {
        finalCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: s.finalGrade >= 6 ? 'FFD7FFB8' : 'FFFFDFE0' },
        };
        finalCell.font = {
          bold: true,
          color: { argb: s.finalGrade >= 6 ? 'FF46A302' : 'FFFF4B4B' },
        };
      }
      finalCell.alignment = { horizontal: 'center' };
      row.getCell('num').alignment = { horizontal: 'center' };
      row.getCell('suggested').alignment = { horizontal: 'center' };
    });

    // ── Hoja 2: Resumen ──
    const summary = workbook.addWorksheet('Resumen');
    summary.columns = [
      { header: 'Métrica', key: 'metric', width: 24 },
      { header: 'Valor', key: 'value', width: 14 },
    ];
    summary.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF58CC02' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    });

    const s = data.stats;
    [
      { metric: 'Ruta', value: data.path.name },
      { metric: 'Código', value: data.path.code },
      { metric: 'Total estudiantes', value: data.totalStudents },
      { metric: 'Calificados', value: data.gradedStudents },
      { metric: 'Promedio de la clase', value: s.average ?? '—' },
      { metric: 'Nota más alta', value: s.max ?? '—' },
      { metric: 'Nota más baja', value: s.min ?? '—' },
      { metric: '% Aprobados', value: s.passRate ? `${s.passRate}%` : '—' },
      { metric: 'Fecha de generación', value: DateTime.now().toFormat(formatDateFrontend) },
    ].forEach((row) => summary.addRow(row));

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  /** Obtiene los IDs de todas las actividades de los cursos de una ruta */
  private async getPathActivityIds(pathId: number): Promise<number[]> {
    const rows: { activity_id: number }[] = await this.progressRepo.manager.query(
      `SELECT a.id AS activity_id
       FROM activity a
       INNER JOIN tema t ON a."temaId" = t.id
       INNER JOIN chapter ch ON t."chapterId" = ch.id
       INNER JOIN learning_path_courses lpc ON lpc.course_id = ch."courseId"
       WHERE lpc.learning_path_id = $1
         AND a."deletedAt" IS NULL
         AND t."deletedAt" IS NULL
         AND ch."deletedAt" IS NULL`,
      [pathId],
    );
    return rows.map((r) => r.activity_id);
  }

  /** Nota sugerida = SUM(accuracy del mejor intento) / totalActividades / 10 */
  private async calculateSuggestedGrade(
    studentId: number,
    activityIds: number[],
    totalActivities: number,
  ): Promise<number> {
    if (totalActivities === 0) return 0;
    if (activityIds.length === 0) return 0;

    const result = await this.progressRepo
      .createQueryBuilder('apu')
      .select('SUM(apu.accuracy)', 'sumAcc')
      .where('apu.activity.id IN (:...ids)', { ids: activityIds })
      .andWhere('apu.user.id = :studentId', { studentId })
      .getRawOne();

    const sumAcc = result?.sumAcc ? Number(result.sumAcc) : 0;
    return parseFloat((sumAcc / totalActivities / 10).toFixed(2));
  }

  /** Calcula estadísticas de un array de notas */
  private buildStats(grades: (number | null)[]): any {
    const valid = grades.filter((g): g is number => g !== null);
    if (valid.length === 0) {
      return { average: null, max: null, min: null, passRate: null, approved: 0, failed: 0 };
    }
    const avg = parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
    const max = parseFloat(Math.max(...valid).toFixed(2));
    const min = parseFloat(Math.min(...valid).toFixed(2));
    const approved = valid.filter((g) => g >= 6).length;
    const passRate = parseFloat(((approved / valid.length) * 100).toFixed(1));
    return { average: avg, max, min, approved, failed: valid.length - approved, passRate };
  }
}
