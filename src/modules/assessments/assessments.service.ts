import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateRulesDto } from './dto/update-rules.dto';
import { ScheduleAssessmentDto } from './dto/schedule-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { Assessment, UserRole } from '@prisma/client';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAssessmentDto): Promise<Assessment> {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company profile not found for user');
    }

    const existingAssessment = await this.prisma.assessment.findFirst({
      where: {
        companyId: company.id,
        title: dto.title,
      },
    });

    if (existingAssessment) {
      throw new ConflictException('An assessment with this title already exists');
    }

    return this.prisma.assessment.create({
      data: {
        ...dto,
        companyId: company.id,
        examDate: new Date(), // Default temporary date
        startTime: new Date(),
        endTime: new Date(),
      },
    });
  }

  async findAll(userId: string): Promise<Assessment[]> {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return [];
    }

    return this.prisma.assessment.findMany({
      where: { companyId: company.id },
    });
  }

  async findOne(userId: string, assessmentId: string): Promise<Assessment> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { company: true },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.company.userId !== userId) {
      throw new ForbiddenException('You do not have access to this assessment');
    }

    return assessment;
  }

  async updateRules(userId: string, assessmentId: string, dto: UpdateRulesDto): Promise<Assessment> {
    await this.findOne(userId, assessmentId); // Validates existence and ownership

    return this.prisma.assessment.update({
      where: { id: assessmentId },
      data: dto,
    });
  }

  async schedule(userId: string, assessmentId: string, dto: ScheduleAssessmentDto): Promise<Assessment> {
    await this.findOne(userId, assessmentId); // Validates existence and ownership

    return this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        examDate: new Date(dto.examDate),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        status: 'PUBLISHED', // Assuming scheduling publishes the assessment
      },
    });
  }

  async update(userId: string, assessmentId: string, dto: UpdateAssessmentDto): Promise<Assessment> {
    await this.findOne(userId, assessmentId); // Validates existence and ownership

    return this.prisma.assessment.update({
      where: { id: assessmentId },
      data: dto,
    });
  }

  async remove(userId: string, assessmentId: string): Promise<Assessment> {
    await this.findOne(userId, assessmentId); // Validates existence and ownership

    return this.prisma.assessment.delete({
      where: { id: assessmentId },
    });
  }
}
