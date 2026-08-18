import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';

describe('AssessmentsController', () => {
  let controller: AssessmentsController;

  const mockAssessmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateRules: jest.fn(),
    schedule: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentsController],
      providers: [
        {
          provide: AssessmentsService,
          useValue: mockAssessmentsService,
        },
      ],
    }).compile();

    controller = module.get<AssessmentsController>(AssessmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
