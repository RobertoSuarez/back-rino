import { ApiProperty } from '@nestjs/swagger';

export class TeacherDashboardDto {
  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  totalLearningPaths: number;

  @ApiProperty()
  totalCourses: number;

  @ApiProperty()
  activeSubscriptions: number;

  @ApiProperty()
  averageProgress: number;

  @ApiProperty()
  recentStudents: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    urlAvatar: string;
    subscribedAt: string;
  }>;

  @ApiProperty()
  topLearningPaths: Array<{
    id: number;
    name: string;
    code: string;
    studentsCount: number;
    coursesCount: number;
  }>;

  @ApiProperty()
  recentCourses: Array<{
    id: number;
    title: string;
    code: string;
    urlLogo: string;
    chaptersCount: number;
    createdAt: string;
  }>;

  @ApiProperty()
  studentsByPath: Array<{
    pathName: string;
    count: number;
  }>;
}
