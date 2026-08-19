import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class SubmitRoomVerificationDto {
  @ApiProperty({ enum: VerificationStatus, example: 'VERIFIED' })
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  fullRoomScanPassed?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  deskScanPassed?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  prohibitedItemsDetected?: boolean;
}
