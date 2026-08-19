import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('AttemptsService', () => {
  let service: AttemptsService;

  const mockPrismaService = {
    assessmentInvitation: {
      findUnique: jest.fn(),
    },
    examAttempt: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AttemptsService>(AttemptsService);
  });

  it('should throw BadRequestException if exam has not started yet', async () => {
    // Set startTime to 1 hour in the future
    const futureStartTime = new Date();
    futureStartTime.setHours(futureStartTime.getHours() + 1);

    mockPrismaService.assessmentInvitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      candidateId: 'cand-1',
      assessment: {
        id: 'asm-1',
        startTime: futureStartTime,
        endTime: new Date(futureStartTime.getTime() + 6000000),
      },
    });

    await expect(service.startAttempt('cand-1', 'inv-1')).rejects.toThrow(BadRequestException);
    await expect(service.startAttempt('cand-1', 'inv-1')).rejects.toThrow('The assessment has not started yet.');
  });

  it('should throw BadRequestException if exam time has expired', async () => {
    // Set endTime to 1 hour in the past
    const pastEndTime = new Date();
    pastEndTime.setHours(pastEndTime.getHours() - 1);

    mockPrismaService.assessmentInvitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      candidateId: 'cand-1',
      assessment: {
        id: 'asm-1',
        startTime: new Date(pastEndTime.getTime() - 6000000),
        endTime: pastEndTime,
      },
    });

    await expect(service.startAttempt('cand-1', 'inv-1')).rejects.toThrow(BadRequestException);
    await expect(service.startAttempt('cand-1', 'inv-1')).rejects.toThrow('The assessment time has expired.');
  });
});
