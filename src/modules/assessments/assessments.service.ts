import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateRulesDto } from './dto/update-rules.dto';
import { ScheduleAssessmentDto } from './dto/schedule-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { Assessment, UserRole, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    const assessment = await this.findOne(userId, assessmentId); // Validates existence and ownership

    const deleted = await this.prisma.assessment.delete({
      where: { id: assessmentId },
    });

    await this.notificationsService.createNotification(
      userId,
      'Assessment Deleted',
      `Assessment "${assessment.title}" was deleted.`,
      NotificationType.WARNING,
      `company_assessment_delete_${assessmentId}_${Date.now()}`,
    );

    return deleted;
  }

  async getDashboardStats(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const totalAssessments = await this.prisma.assessment.count({
      where: { companyId: company.id },
    });

    const totalCandidates = await this.prisma.assessmentInvitation.count({
      where: { assessment: { companyId: company.id } },
    });

    const attempts = await this.prisma.examAttempt.findMany({
      where: { assessment: { companyId: company.id }, status: 'SUBMITTED' },
      select: { passed: true },
    });

    const totalAttemptsCount = attempts.length;
    const passedCount = attempts.filter((a) => a.passed).length;
    const averagePassRate = totalAttemptsCount > 0 ? `${Math.round((passedCount / totalAttemptsCount) * 100)}%` : '0%';

    const riskScores = await this.prisma.riskScore.aggregate({
      where: { attempt: { assessment: { companyId: company.id } } },
      _avg: { normalizedScore: true },
    });

    const avgRiskScoreVal = riskScores._avg.normalizedScore;
    const averageRisk = avgRiskScoreVal !== null ? `${Math.round(avgRiskScoreVal * 100)}%` : '0%';

    const logs = await this.prisma.proctoringEvent.findMany({
      where: { attempt: { assessment: { companyId: company.id } } },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        attempt: {
          include: {
            candidate: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
            assessment: {
              select: { title: true },
            },
          },
        },
      },
    });

    const recentLogs = logs.map((l) => ({
      id: l.id,
      candidate: l.attempt.candidate.user.firstName
        ? `${l.attempt.candidate.user.firstName} ${l.attempt.candidate.user.lastName}`
        : l.attempt.candidate.user.email,
      assessment: l.attempt.assessment.title,
      action: l.description || l.eventType,
      severity: l.severity,
      time: l.timestamp.toISOString(),
    }));

    return {
      totalAssessments,
      totalCandidates,
      averagePassRate,
      averageRisk,
      recentLogs,
    };
  }

  async getCompanyCandidates(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const invitations = await this.prisma.assessmentInvitation.findMany({
      where: {
        assessment: { companyId: company.id },
      },
      include: {
        candidate: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    });

    const candidateMap = new Map<string, any>();
    for (const inv of invitations) {
      const candId = inv.candidateId;
      if (!candidateMap.has(candId)) {
        candidateMap.set(candId, {
          id: candId,
          firstName: inv.candidate.user.firstName || '',
          lastName: inv.candidate.user.lastName || '',
          email: inv.candidate.user.email,
          phone: inv.candidate.phone || undefined,
          status: inv.status === 'INVITED' ? 'INVITED' : 'PENDING',
          invitedAssessmentIds: [inv.assessmentId],
        });
      } else {
        candidateMap.get(candId).invitedAssessmentIds.push(inv.assessmentId);
      }
    }

    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        assessment: { companyId: company.id },
      },
      include: {
        candidate: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    for (const att of attempts) {
      const candId = att.candidateId;
      if (candidateMap.has(candId)) {
        if (att.status === 'SUBMITTED' || att.status === 'AUTO_SUBMITTED') {
          candidateMap.get(candId).status = 'COMPLETED';
        }
      } else {
        candidateMap.set(candId, {
          id: candId,
          firstName: att.candidate.user.firstName || '',
          lastName: att.candidate.user.lastName || '',
          email: att.candidate.user.email,
          phone: att.candidate.phone || undefined,
          status: (att.status === 'SUBMITTED' || att.status === 'AUTO_SUBMITTED') ? 'COMPLETED' : 'INVITED',
          invitedAssessmentIds: [att.assessmentId],
        });
      }
    }

    return Array.from(candidateMap.values());
  }

  async getCompanyLogs(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        assessment: { companyId: company.id },
      },
      include: {
        candidate: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        assessment: {
          select: { title: true },
        },
        identityVerification: true,
        roomVerification: true,
        riskScore: true,
        proctoringEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return attempts.map((att) => {
      const name = att.candidate.user.firstName
        ? `${att.candidate.user.firstName} ${att.candidate.user.lastName}`
        : att.candidate.user.email;

      let overallRisk: 'CRITICAL' | 'HIGH' | 'LOW' = 'LOW';
      if (att.riskScore) {
        if (att.riskScore.riskLevel === 'HIGH') {
          overallRisk = 'CRITICAL';
        } else if (att.riskScore.riskLevel === 'MEDIUM') {
          overallRisk = 'HIGH';
        }
      }

      let faceMatchStatus: 'CONFIRMED' | 'FAILED' | 'WARNING' = 'WARNING';
      if (att.identityVerification) {
        if (att.identityVerification.status === 'VERIFIED') {
          faceMatchStatus = 'CONFIRMED';
        } else if (att.identityVerification.status === 'FAILED') {
          faceMatchStatus = 'FAILED';
        }
      }

      let roomScanStatus: 'CLEAN' | 'WARNING' = 'WARNING';
      if (att.roomVerification) {
        if (att.roomVerification.status === 'VERIFIED') {
          roomScanStatus = 'CLEAN';
        }
      }

      const events = att.proctoringEvents.map((e) => {
        let severity: 'CRITICAL' | 'HIGH' | 'LOW' = 'LOW';
        if (e.severity === 'CRITICAL') {
          severity = 'CRITICAL';
        } else if (e.severity === 'HIGH' || e.severity === 'MEDIUM') {
          severity = 'HIGH';
        }
        return {
          id: e.id,
          eventType: e.eventType,
          description: e.description || '',
          severity,
          timestamp: e.timestamp.toISOString(),
        };
      });

      return {
        id: att.id,
        name,
        email: att.candidate.user.email,
        assessmentTitle: att.assessment.title,
        overallRisk,
        tabSwitches: att.tabSwitchCount,
        faceMatchStatus,
        roomScanStatus,
        events,
      };
    });
  }

  async updateCandidate(userId: string, candidateId: string, dto: { firstName?: string; lastName?: string; phone?: string }) {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    // Verify candidate has an invitation to any assessment of this company
    const invitation = await this.prisma.assessmentInvitation.findFirst({
      where: {
        candidateId,
        assessment: { companyId: company.id },
      },
    });

    if (!invitation) {
      throw new ForbiddenException('Candidate not associated with this company');
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    await this.prisma.user.update({
      where: { id: candidate.userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: {
        phone: dto.phone,
      },
      include: {
        user: true,
      },
    });
  }

  async removeCandidate(userId: string, candidateId: string) {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    // Verify candidate has an invitation to any assessment of this company
    const invitation = await this.prisma.assessmentInvitation.findFirst({
      where: {
        candidateId,
        assessment: { companyId: company.id },
      },
    });

    if (!invitation) {
      throw new ForbiddenException('Candidate not associated with this company');
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    await this.prisma.user.delete({
      where: { id: candidate.userId },
    });

    return { message: 'Candidate deleted successfully' };
  }
}
