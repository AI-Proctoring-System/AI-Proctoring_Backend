import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class SubmitIdentityVerificationDto {
  @ApiProperty({ enum: VerificationStatus, example: 'VERIFIED' })
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @ApiPropertyOptional({ example: 85.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  similarityScore?: number;

  @ApiPropertyOptional({ example: 92.1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  faceMatchConfidence?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  livenessPassed?: boolean;
}
