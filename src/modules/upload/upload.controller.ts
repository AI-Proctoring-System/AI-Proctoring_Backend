import {
  Controller,
  Post,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UpdateCompanyLogoDto } from './dto/update-company-logo.dto';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Post('company-logo')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload company logo as base64' })
  @ApiBody({ type: UpdateCompanyLogoDto })
  async uploadCompanyLogo(
    @Body() dto: UpdateCompanyLogoDto,
    @CurrentUser() user: any,
  ) {
    if (!dto.logoDataUrl || !dto.logoDataUrl.startsWith('data:image/')) {
      throw new BadRequestException('Invalid image data URL');
    }

    try {
      // Save Base64 string directly in database Company.logoUrl
      const company = await this.prisma.company.update({
        where: { userId: user.sub },
        data: { logoUrl: dto.logoDataUrl },
      });

      return {
        message: 'Logo uploaded successfully',
        logoUrl: company.logoUrl,
      };
    } catch (error) {
      throw new BadRequestException('Failed to update company logo');
    }
  }
}
