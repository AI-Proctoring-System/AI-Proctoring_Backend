import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { LogBrowserEventDto } from './dto/log-browser-event.dto';
import { LogAiEventDto } from './dto/log-ai-event.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Telemetry (Candidate Portal)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE) // Only candidates can push telemetry
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post(':attemptId/browser')
  @ApiOperation({ summary: 'Log a browser telemetry event (e.g. Tab switch, Fullscreen exit)' })
  logBrowserEvent(
    @CurrentUser() user: any,
    @Param('attemptId') attemptId: string,
    @Body() dto: LogBrowserEventDto,
  ) {
    return this.telemetryService.logBrowserEvent(user.candidateId, attemptId, dto);
  }

  @Post(':attemptId/ai')
  @ApiOperation({ summary: 'Log an AI vision/audio telemetry event (e.g. Head turn, Speech detected)' })
  logAiEvent(
    @CurrentUser() user: any,
    @Param('attemptId') attemptId: string,
    @Body() dto: LogAiEventDto,
  ) {
    return this.telemetryService.logAiEvent(user.candidateId, attemptId, dto);
  }
}
