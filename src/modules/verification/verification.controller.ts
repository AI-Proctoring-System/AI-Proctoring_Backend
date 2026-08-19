import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { SubmitRoomVerificationDto } from './dto/submit-room-verification.dto';
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

  @Get(':attemptId/room/status')
  @ApiOperation({ summary: 'Poll the room environment verification status' })
  getRoomStatus(
    @CurrentUser() user: any,
    @Param('attemptId') attemptId: string,
  ) {
    return this.verificationService.getRoomVerificationStatus(user.candidateId, attemptId);
  }

  @Post(':attemptId/room')
  @ApiOperation({ summary: 'Submit or update room verification checklist status' })
  submitRoomVerification(
    @CurrentUser() user: any,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitRoomVerificationDto,
  ) {
    return this.verificationService.submitRoomVerification(user.candidateId, attemptId, dto);
  }
}
