import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('QuestionsService', () => {
  let service: QuestionsService;

  const mockPrismaService = {
    assessment: {
      findUnique: jest.fn(),
    },
    question: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
