import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitRoomVerificationDto } from './dto/submit-room-verification.dto';
import { SubmitIdentityVerificationDto } from './dto/submit-identity-verification.dto';

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

  async getRoomVerificationStatus(candidateId: string, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== candidateId) {
      throw new ForbiddenException('Attempt not found or access denied');
    }

    const verification = await this.prisma.roomVerification.findUnique({
      where: { attemptId },
    });

    if (!verification) {
      throw new NotFoundException('Room verification record not found for this attempt');
    }

    return verification;
  }

  async submitRoomVerification(candidateId: string, attemptId: string, dto: SubmitRoomVerificationDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== candidateId) {
      throw new ForbiddenException('Attempt not found or access denied');
    }

    return this.prisma.roomVerification.upsert({
      where: { attemptId },
      update: {
        status: dto.status,
        fullRoomScanPassed: dto.fullRoomScanPassed,
        deskScanPassed: dto.deskScanPassed,
        prohibitedItemsDetected: dto.prohibitedItemsDetected,
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
      },
      create: {
        attemptId,
        status: dto.status,
        fullRoomScanPassed: dto.fullRoomScanPassed,
        deskScanPassed: dto.deskScanPassed,
        prohibitedItemsDetected: dto.prohibitedItemsDetected,
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
      },
    });
  }

  async submitIdentityVerification(candidateId: string, attemptId: string, dto: SubmitIdentityVerificationDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== candidateId) {
      throw new ForbiddenException('Attempt not found or access denied');
    }

    return this.prisma.identityVerification.upsert({
      where: { attemptId },
      update: {
        status: dto.status,
        similarityScore: dto.similarityScore,
        faceMatchConfidence: dto.faceMatchConfidence,
        livenessPassed: dto.livenessPassed,
        verificationAttempts: { increment: 1 },
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
      },
      create: {
        candidateId,
        attemptId,
        status: dto.status,
        similarityScore: dto.similarityScore,
        faceMatchConfidence: dto.faceMatchConfidence,
        livenessPassed: dto.livenessPassed,
        verificationAttempts: 1,
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
      },
    });
  }
}
