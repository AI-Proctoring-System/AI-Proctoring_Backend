import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogBrowserEventDto } from './dto/log-browser-event.dto';
import { LogAiEventDto } from './dto/log-ai-event.dto';
import { AttemptStatus } from '@prisma/client';

@Injectable()
export class TelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  async logBrowserEvent(candidateId: string, attemptId: string, dto: LogBrowserEventDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== candidateId) {
      throw new ForbiddenException('Attempt not found or access denied');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot log telemetry events. Attempt is currently ${attempt.status}`);
    }

    // Insert the proctoring event
    const event = await this.prisma.proctoringEvent.create({
      data: {
        attemptId,
        source: 'Browser',
        eventType: dto.eventType,
        severity: dto.severity,
        description: dto.description,
      },
    });

    // Automatically increment tab switch count if the event is a TAB_SWITCH
    if (dto.eventType === 'TAB_SWITCH') {
      await this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          tabSwitchCount: {
            increment: 1,
          },
        },
      });
    }

    return { success: true, eventId: event.id };
  }

  async logAiEvent(candidateId: string, attemptId: string, dto: LogAiEventDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== candidateId) {
      throw new ForbiddenException('Attempt not found or access denied');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot log telemetry events. Attempt is currently ${attempt.status}`);
    }

    // Insert the proctoring event
    const event = await this.prisma.proctoringEvent.create({
      data: {
        attemptId,
        source: 'AI',
        eventType: dto.eventType,
        severity: dto.severity,
        confidence: dto.confidence,
        durationSeconds: dto.durationSeconds,
        description: dto.description,
        evidenceType: dto.evidenceType,
        evidenceUrl: dto.evidenceUrl,
      },
    });

    return { success: true, eventId: event.id };
  }
}
