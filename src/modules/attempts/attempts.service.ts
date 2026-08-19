import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveAnswersDto } from './dto/save-answers.dto';
import { AttemptStatus, AnswerStatus } from '@prisma/client';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async getScheduledAttempts(candidateId: string) {
    return this.prisma.assessmentInvitation.findMany({
      where: { candidateId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            assessmentType: true,
            instructions: true,
            examDate: true,
            startTime: true,
            endTime: true,
            durationMinutes: true,
            status: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    });
  }

  async startAttempt(candidateId: string, invitationId: string) {
    const invitation = await this.prisma.assessmentInvitation.findUnique({
      where: { id: invitationId },
      include: { assessment: true },
    });

    if (!invitation || invitation.candidateId !== candidateId) {
      throw new ForbiddenException('Invitation not found or access denied');
    }

    const assessment = invitation.assessment;

    // Server-Side Time Gate Validation
    const now = new Date();
    // Compare times using simple logic (could be expanded based on timezone needs)
    if (now < assessment.startTime) {
      throw new BadRequestException('The assessment has not started yet.');
    }
    if (now > assessment.endTime) {
      throw new BadRequestException('The assessment time has expired.');
    }

    // Upsert Attempt
    const attempt = await this.prisma.examAttempt.upsert({
      where: {
        assessmentId_candidateId: {
          assessmentId: assessment.id,
          candidateId,
        },
      },
      update: {
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      create: {
        assessmentId: assessment.id,
        candidateId,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    // Fetch questions to send back to candidate
    const questions = await this.prisma.question.findMany({
      where: { assessmentId: assessment.id },
      include: {
        options: {
          select: { id: true, optionText: true, optionLabel: true, orderNumber: true }, // Don't send isCorrect!
        },
      },
    });

    return { attempt, questions };
  }

  async saveAnswers(candidateId: string, attemptId: string, dto: SaveAnswersDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== candidateId) {
      throw new ForbiddenException('Attempt not found or access denied');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot save answers. Attempt is not in progress.');
    }

    const upsertPromises = dto.answers.map(async (ans) => {
      return this.prisma.candidateAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: ans.questionId,
          },
        },
        update: {
          selectedOptionId: ans.selectedOptionId,
          textAnswer: ans.textAnswer,
          codeAnswer: ans.codeAnswer,
          status: AnswerStatus.ANSWERED,
          answeredAt: new Date(),
        },
        create: {
          attemptId,
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
          textAnswer: ans.textAnswer,
          codeAnswer: ans.codeAnswer,
          status: AnswerStatus.ANSWERED,
          answeredAt: new Date(),
        },
      });
    });

    await Promise.all(upsertPromises);

    return { message: 'Answers saved successfully' };
  }

  async submitAttempt(candidateId: string, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== candidateId) {
      throw new ForbiddenException('Attempt not found or access denied');
    }

    // Score calculation could go here depending on requirements.
    // For now, mark as submitted.
    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }
}
