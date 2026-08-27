import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { candidate: true, company: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Auto-generate notifications for Candidate if needed
    if (user.role === UserRole.CANDIDATE && user.candidate) {
      await this.syncCandidateNotifications(user.id, user.candidate.id);
    } else {
      let companyId = user.company?.id;
      if (!companyId) {
        const comp = await this.prisma.company.findUnique({
          where: { userId: user.id },
        });
        if (comp) companyId = comp.id;
      }

      if (companyId) {
        await this.syncCompanyNotifications(user.id, companyId);
      }
    }

    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    referenceId?: string,
    createdAt?: Date,
  ) {
    // If referenceId is provided, check if notification already exists to avoid duplication
    if (referenceId) {
      const existing = await this.prisma.notification.findFirst({
        where: { userId, referenceId },
      });
      if (existing) {
        if (createdAt && existing.createdAt.getTime() !== createdAt.getTime()) {
          return this.prisma.notification.update({
            where: { id: existing.id },
            data: { createdAt },
          });
        }
        return existing;
      }
    }

    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        referenceId,
        createdAt: createdAt || new Date(),
      },
    });
  }

  private async syncCandidateNotifications(userId: string, candidateId: string) {
    const invitations = await this.prisma.assessmentInvitation.findMany({
      where: { candidateId },
      include: {
        assessment: true,
      },
    });

    const attempts = await this.prisma.examAttempt.findMany({
      where: { candidateId },
    });

    const attemptMap = new Map(attempts.map((att) => [att.assessmentId, att]));
    const now = new Date();

    for (const inv of invitations) {
      const { assessment } = inv;
      if (assessment.status !== 'PUBLISHED') continue;

      const attempt = attemptMap.get(assessment.id);
      const endTime = new Date(assessment.endTime);

      // 1. Check Invitation notification (real date: when invited)
      await this.createNotification(
        userId,
        'New Exam Invitation',
        `You have been invited to take the ${assessment.title} assessment.`,
        NotificationType.INFO,
        `invitation_${inv.id}`,
        inv.invitedAt,
      );

      // 2. Check Submission notification (real date: when submitted)
      if (attempt && (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED')) {
        await this.createNotification(
          userId,
          'Test Submitted',
          `Your submission for ${assessment.title} has been received.`,
          NotificationType.SUCCESS,
          `submission_${attempt.id}`,
          attempt.submittedAt || new Date(),
        );
      }
      // 3. Check Missed Test notification (real date: when exam window ended)
      else if (now > endTime && (!attempt || attempt.status === 'NOT_STARTED')) {
        await this.createNotification(
          userId,
          'Test Window Closed',
          `The examination window for ${assessment.title} has closed.`,
          NotificationType.WARNING,
          `missed_${inv.id}`,
          assessment.endTime,
        );
      }
    }
  }

  private async syncCompanyNotifications(userId: string, companyId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: { companyId },
      include: {
        invitations: {
          include: {
            candidate: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
        attempts: {
          include: {
            candidate: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
            riskScore: true,
          },
        },
      },
    });

    for (const assessment of assessments) {
      // 1. Assessment Created Notification
      await this.createNotification(
        userId,
        'Assessment Created',
        `Assessment "${assessment.title}" (${assessment.assessmentType}) was created.`,
        NotificationType.INFO,
        `company_assessment_create_${assessment.id}`,
        assessment.createdAt,
      );

      // 2. Assessment Updated Notification (if updated > 10s after creation)
      if (assessment.updatedAt.getTime() - assessment.createdAt.getTime() > 10000) {
        await this.createNotification(
          userId,
          'Assessment Updated',
          `Assessment "${assessment.title}" settings or details were updated.`,
          NotificationType.INFO,
          `company_assessment_update_${assessment.id}_${Math.floor(assessment.updatedAt.getTime() / 60000)}`,
          assessment.updatedAt,
        );
      }

      // 3. Invitations Sent Notification
      for (const inv of assessment.invitations) {
        const candUser = inv.candidate?.user;
        const candName = candUser?.firstName ? `${candUser.firstName} ${candUser.lastName}` : inv.email;
        await this.createNotification(
          userId,
          'Candidate Invited',
          `${candName} was invited to take "${assessment.title}".`,
          NotificationType.INFO,
          `company_invitation_${inv.id}`,
          inv.invitedAt,
        );
      }

      // 4. Attempts Completed & Proctoring Alerts
      for (const att of assessment.attempts) {
        const candUser = att.candidate?.user;
        const candName = candUser?.firstName ? `${candUser.firstName} ${candUser.lastName}` : candUser?.email || 'Candidate';

        if (att.status === 'SUBMITTED' || att.status === 'AUTO_SUBMITTED') {
          const scoreText = att.percentage !== null ? ` (Score: ${Math.round(att.percentage)}%)` : '';
          await this.createNotification(
            userId,
            'Assessment Completed',
            `${candName} submitted "${assessment.title}"${scoreText}.`,
            NotificationType.SUCCESS,
            `company_submission_${att.id}`,
            att.submittedAt || att.updatedAt,
          );
        }

        // Proctoring / High Risk Alert
        if (att.tabSwitchCount > 0 || (att.riskScore && att.riskScore.flaggedForReview)) {
          const flagReason = att.riskScore?.flaggedForReview
            ? `Risk level: ${att.riskScore.riskLevel}`
            : `${att.tabSwitchCount} tab switch(es) detected`;

          await this.createNotification(
            userId,
            'Proctoring Alert Flagged',
            `Proctoring flag for ${candName} on "${assessment.title}" (${flagReason}).`,
            NotificationType.WARNING,
            `company_proctoring_flag_${att.id}`,
            att.updatedAt,
          );
        }
      }
    }
  }
}
