import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsArray, ValidateNested, IsBoolean, IsOptional, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnswerOptionDto {
  @ApiProperty({ example: 'A binary tree' })
  @IsString()
  @MaxLength(500, { message: 'Option text cannot exceed 500 characters' })
  optionText!: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  @MaxLength(10, { message: 'Option label cannot exceed 10 characters' })
  optionLabel!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect!: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  orderNumber!: number;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'MCQ' })
  @IsString()
  @MaxLength(50, { message: 'Question type cannot exceed 50 characters' })
  questionType!: string;

  @ApiProperty({ example: 'What is a heap?' })
  @IsString()
  @MaxLength(2000, { message: 'Question text cannot exceed 2000 characters' })
  questionText!: string;

  @ApiProperty({ example: 5 })
  @IsNumber({}, { message: 'Marks must be a number' })
  @Min(1, { message: 'Marks must be at least 1' })
  @Max(100, { message: 'Marks cannot exceed 100' })
  marks!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  orderNumber!: number;

  @ApiPropertyOptional({ type: [CreateAnswerOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerOptionDto)
  options?: CreateAnswerOptionDto[];
}
