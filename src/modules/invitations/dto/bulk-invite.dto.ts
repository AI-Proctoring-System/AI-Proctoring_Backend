import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CandidateCsvItemDto {
  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class BulkInviteDto {
  @ApiProperty({ type: [CandidateCsvItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateCsvItemDto)
  candidates!: CandidateCsvItemDto[];
}
