import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'Midterm Exam' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Please read instructions carefully.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  assessmentType!: string;

  @ApiPropertyOptional({ example: 'No calculators allowed.' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0)
  passingScore!: number;
}
