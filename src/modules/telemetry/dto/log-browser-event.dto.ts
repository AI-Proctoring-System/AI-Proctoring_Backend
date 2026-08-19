import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ProctoringEventSeverity } from '@prisma/client';

export class LogBrowserEventDto {
  @ApiProperty({ example: 'TAB_SWITCH', description: 'The type of browser event' })
  @IsString()
  @MaxLength(100)
  eventType!: string;

  @ApiProperty({ enum: ProctoringEventSeverity, example: 'MEDIUM' })
  @IsEnum(ProctoringEventSeverity)
  severity!: ProctoringEventSeverity;

  @ApiPropertyOptional({ example: 'Candidate switched away from the exam tab' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
