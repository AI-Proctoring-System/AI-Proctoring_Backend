import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { SaveAnswersDto } from './dto/save-answers.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Attempts (Candidate Portal)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE) // Only candidates can access these routes
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get('invitation/:invitationId')
  @ApiOperation({ summary: 'Get invitation and basic assessment details' })
  getInvitationDetails(
    @CurrentUser() user: any,
    @Param('invitationId') invitationId: string,
  ) {
    return this.attemptsService.getInvitationDetails(user.candidateId, invitationId);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'List all scheduled assessments for the candidate' })
  getScheduledAttempts(@CurrentUser() user: any) {
    return this.attemptsService.getScheduledAttempts(user.candidateId);
  }

  @Post('start/:invitationId')
  @ApiOperation({ summary: 'Start an exam attempt' })
  startAttempt(
    @CurrentUser() user: any,
    @Param('invitationId') invitationId: string,
  ) {
    return this.attemptsService.startAttempt(user.candidateId, invitationId);
  }

  @Post(':id/answers')
  @ApiOperation({ summary: 'Autosave candidate answers' })
  saveAnswers(
    @CurrentUser() user: any,
    @Param('id') attemptId: string,
    @Body() saveAnswersDto: SaveAnswersDto,
  ) {
    return this.attemptsService.saveAnswers(user.candidateId, attemptId, saveAnswersDto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit and lock the exam attempt' })
  submitAttempt(
    @CurrentUser() user: any,
    @Param('id') attemptId: string,
  ) {
    return this.attemptsService.submitAttempt(user.candidateId, attemptId);
  }
}
