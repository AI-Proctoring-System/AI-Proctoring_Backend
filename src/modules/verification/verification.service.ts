import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getVerificationStatus(candidateId: string, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== candidateId) {
      throw new ForbiddenException('Attempt not found or access denied');
    }

    const verification = await this.prisma.identityVerification.findUnique({
      where: { attemptId },
    });

    if (!verification) {
      throw new NotFoundException('Verification record not found for this attempt');
    }

    return verification;
  }
}
