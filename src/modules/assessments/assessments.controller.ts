import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateRulesDto } from './dto/update-rules.dto';
import { ScheduleAssessmentDto } from './dto/schedule-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Only recruiters/admins can manage assessments
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new draft assessment' })
  create(@CurrentUser() user: any, @Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentsService.create(user.sub, createAssessmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all assessments for the recruiter' })
  findAll(@CurrentUser() user: any) {
    return this.assessmentsService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific assessment' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.assessmentsService.findOne(user.sub, id);
  }

  @Patch(':id/rules')
  @ApiOperation({ summary: 'Configure assessment proctoring rules and thresholds' })
  updateRules(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateRulesDto: UpdateRulesDto,
  ) {
    return this.assessmentsService.updateRules(user.sub, id, updateRulesDto);
  }

  @Patch(':id/schedule')
  @ApiOperation({ summary: 'Schedule the assessment exam date and times' })
  schedule(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() scheduleAssessmentDto: ScheduleAssessmentDto,
  ) {
    return this.assessmentsService.schedule(user.sub, id, scheduleAssessmentDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assessment details' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
  ) {
    return this.assessmentsService.update(user.sub, id, updateAssessmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an assessment' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.assessmentsService.remove(user.sub, id);
  }
}
