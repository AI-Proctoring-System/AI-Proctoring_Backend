import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { ProctoringEventSeverity, EvidenceType } from '@prisma/client';

export class LogAiEventDto {
  @ApiProperty({ example: 'UNAUTHORIZED_OBJECT', description: 'The type of AI violation event' })
  @IsString()
  @MaxLength(100)
  eventType!: string;

  @ApiProperty({ enum: ProctoringEventSeverity, example: 'HIGH' })
  @IsEnum(ProctoringEventSeverity)
  severity!: ProctoringEventSeverity;

  @ApiPropertyOptional({ example: 0.95, description: 'Confidence score of the AI detection (0.0 to 1.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiPropertyOptional({ example: 5.5, description: 'Duration of the event in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 'Candidate turns head away from screen' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: EvidenceType, example: 'SCREENSHOT' })
  @IsOptional()
  @IsEnum(EvidenceType)
  evidenceType?: EvidenceType;

  @ApiPropertyOptional({ example: 'data:image/png;base64,...', description: 'Base64 image data or URL link as evidence' })
  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}
