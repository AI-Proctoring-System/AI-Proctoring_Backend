import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Verification (Candidate Portal)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE) // Only candidates access this polling endpoint
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get(':attemptId/status')
  @ApiOperation({ summary: 'Poll the identity verification status before exam start' })
  getStatus(
    @CurrentUser() user: any,
    @Param('attemptId') attemptId: string,
  ) {
    return this.verificationService.getVerificationStatus(user.candidateId, attemptId);
  }
}
