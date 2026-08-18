import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ScheduleAssessmentDto {
  @ApiProperty({ example: '2026-10-15T00:00:00.000Z' })
  @IsDateString()
  examDate!: string;

  @ApiProperty({ example: '2026-10-15T09:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-10-15T12:00:00.000Z' })
  @IsDateString()
  endTime!: string;
}
