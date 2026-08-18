import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsArray, ValidateNested, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnswerOptionDto {
  @ApiProperty({ example: 'A binary tree' })
  @IsString()
  optionText!: string;

  @ApiProperty({ example: 'A' })
  @IsString()
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
  questionType!: string;

  @ApiProperty({ example: 'What is a heap?' })
  @IsString()
  questionText!: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
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
