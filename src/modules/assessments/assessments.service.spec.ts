import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsService } from './assessments.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AssessmentsService', () => {
  let service: AssessmentsService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
    },
    assessment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
