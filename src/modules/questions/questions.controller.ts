import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('assessments/:assessmentId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new question to an assessment' })
  create(
    @CurrentUser() user: any,
    @Param('assessmentId') assessmentId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionsService.create(user.sub, assessmentId, createQuestionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all questions for an assessment' })
  findAll(
    @CurrentUser() user: any,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.questionsService.findAll(user.sub, assessmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific question' })
  findOne(
    @CurrentUser() user: any,
    @Param('assessmentId') assessmentId: string,
    @Param('id') id: string,
  ) {
    return this.questionsService.findOne(user.sub, assessmentId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific question' })
  update(
    @CurrentUser() user: any,
    @Param('assessmentId') assessmentId: string,
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(user.sub, assessmentId, id, updateQuestionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific question' })
  remove(
    @CurrentUser() user: any,
    @Param('assessmentId') assessmentId: string,
    @Param('id') id: string,
  ) {
    return this.questionsService.remove(user.sub, assessmentId, id);
  }
}
