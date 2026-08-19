import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNumber, Min, Max, IsArray, MaxLength } from 'class-validator';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'Midterm Exam' })
  @IsString()
  @MaxLength(150, { message: 'Title cannot exceed 150 characters' })
  title!: string;

  @ApiPropertyOptional({ example: 'Please read instructions carefully.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  description?: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @MaxLength(100, { message: 'Assessment type cannot exceed 100 characters' })
  assessmentType!: string;

  @ApiPropertyOptional({ example: 'No calculators allowed.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Instructions cannot exceed 2000 characters' })
  instructions?: string;

  @ApiProperty({ example: 60 })
  @IsInt({ message: 'Duration must be an integer' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(300, { message: 'Duration cannot exceed 300 minutes' })
  durationMinutes!: number;

  @ApiProperty({ example: 50.0 })
  @IsNumber({}, { message: 'Passing score must be a number' })
  @Min(0, { message: 'Passing score cannot be negative' })
  @Max(100, { message: 'Passing score cannot exceed 100' })
  passingScore!: number;

  @ApiPropertyOptional({ example: ['scientific calculator', 'blank paper'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedMaterials?: string[];

  @ApiPropertyOptional({ example: ['phone', 'smartwatch', 'headphones'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prohibitedMaterials?: string[];
}
