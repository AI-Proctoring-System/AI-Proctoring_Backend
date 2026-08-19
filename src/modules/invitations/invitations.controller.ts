import { Controller, Post, Get, Body, Param, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { BulkInviteDto } from './dto/bulk-invite.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('assessments/:assessmentId/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk invite candidates to an assessment via CSV parsing' })
  bulkInvite(
    @CurrentUser() user: any,
    @Param('assessmentId') assessmentId: string,
    @Body() bulkInviteDto: BulkInviteDto,
  ) {
    return this.invitationsService.sendBulkInvites(user.sub, assessmentId, bulkInviteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of candidates invited to the assessment' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getInvitations(
    @CurrentUser() user: any,
    @Param('assessmentId') assessmentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.invitationsService.getInvitations(user.sub, assessmentId, page, limit);
  }
}
