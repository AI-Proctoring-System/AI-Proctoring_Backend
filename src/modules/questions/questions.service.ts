import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { BulkCreateQuestionsDto } from './dto/bulk-create-questions.dto';
import { Question } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, assessmentId: string, dto: CreateQuestionDto): Promise<Question> {
    // Validate assessment belongs to user
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { company: true },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.company.userId !== userId) {
      throw new ForbiddenException('You do not have access to modify this assessment');
    }

    if (dto.questionType === 'MCQ') {
      if (!dto.options || dto.options.length === 0) {
        throw new BadRequestException('MCQ questions must have options.');
      }
      
      const correctCount = dto.options.filter(o => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException('MCQ questions must have exactly one correct option.');
      }

      const labels = dto.options.map(o => o.optionLabel);
      if (new Set(labels).size !== labels.length) {
        throw new BadRequestException('Option labels must be unique within a question.');
      }
    }

    return this.prisma.question.create({
      data: {
        assessmentId,
        questionType: dto.questionType,
        questionText: dto.questionText,
        marks: dto.marks,
        orderNumber: dto.orderNumber,
        options: dto.options ? {
          create: dto.options.map((opt) => ({
            optionText: opt.optionText,
            optionLabel: opt.optionLabel,
            isCorrect: opt.isCorrect,
            orderNumber: opt.orderNumber,
          })),
        } : undefined,
      },
      include: {
        options: true,
      },
    });
  }

  async createBulk(userId: string, assessmentId: string, dto: BulkCreateQuestionsDto) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { company: true },
    });

    if (!assessment || assessment.company.userId !== userId) {
      throw new ForbiddenException('You do not have access to modify this assessment');
    }

    const createdQuestions = [];

    for (const q of dto.questions) {
      if (q.questionType === 'MCQ') {
        if (!q.options || q.options.length === 0) {
          throw new BadRequestException('MCQ questions must have options.');
        }
        
        const correctCount = q.options.filter(o => o.isCorrect).length;
        if (correctCount !== 1) {
          throw new BadRequestException('MCQ questions must have exactly one correct option.');
        }

        const labels = q.options.map(o => o.optionLabel);
        if (new Set(labels).size !== labels.length) {
          throw new BadRequestException('Option labels must be unique within a question.');
        }
      }
    }

    // Using a simple loop instead of createMany because createMany doesn't support nested relations (options) in Prisma.
    // If performance is an issue, a raw transaction or $transaction with multiple creates can be used.
    for (const q of dto.questions) {
      const created = await this.prisma.question.create({
        data: {
          assessmentId,
          questionType: q.questionType,
          questionText: q.questionText,
          marks: q.marks,
          orderNumber: q.orderNumber,
          options: (q.options && q.questionType === 'MCQ') ? {
            create: q.options.map((opt) => ({
              optionText: opt.optionText,
              optionLabel: opt.optionLabel,
              isCorrect: opt.isCorrect,
              orderNumber: opt.orderNumber,
            })),
          } : undefined,
        },
        include: {
          options: true,
        },
      });
      createdQuestions.push(created);
    }

    return { message: `Successfully imported ${createdQuestions.length} questions.`, questions: createdQuestions };
  }

  async findAll(userId: string, assessmentId: string): Promise<Question[]> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { company: true },
    });

    if (!assessment || assessment.company.userId !== userId) {
      throw new ForbiddenException('You do not have access to this assessment');
    }

    return this.prisma.question.findMany({
      where: { assessmentId },
      include: { options: true },
    });
  }

  async findOne(userId: string, assessmentId: string, questionId: string): Promise<Question> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { company: true },
    });

    if (!assessment || assessment.company.userId !== userId) {
      throw new ForbiddenException('You do not have access to this assessment');
    }

    const question = await this.prisma.question.findFirst({
      where: { id: questionId, assessmentId },
      include: { options: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async update(userId: string, assessmentId: string, questionId: string, dto: UpdateQuestionDto): Promise<Question> {
    await this.findOne(userId, assessmentId, questionId); // validates access and existence

    // For simplicity, we only update top level question fields here. 
    // Updating nested options would require a more complex payload or separate endpoints.
    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        questionType: dto.questionType,
        questionText: dto.questionText,
        marks: dto.marks,
        orderNumber: dto.orderNumber,
      },
      include: { options: true },
    });
  }

  async remove(userId: string, assessmentId: string, questionId: string): Promise<Question> {
    await this.findOne(userId, assessmentId, questionId); // validates access and existence

    return this.prisma.question.delete({
      where: { id: questionId },
    });
  }

  async clearAll(userId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { company: true },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.company.userId !== userId) {
      throw new ForbiddenException('You do not have access to modify this assessment');
    }

    // Delete all answer options related to the assessment questions
    await this.prisma.answerOption.deleteMany({
      where: {
        question: {
          assessmentId,
        },
      },
    });

    return this.prisma.question.deleteMany({
      where: { assessmentId },
    });
  }
}
