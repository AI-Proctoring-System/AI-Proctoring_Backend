import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsArray, ValidateNested, IsOptional, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CandidateCsvItemDto {
  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
  email!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName!: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Phone number must be a valid E.164 format (e.g. +1234567890)' })
  phone?: string;
}

export class BulkInviteDto {
  @ApiProperty({ type: [CandidateCsvItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateCsvItemDto)
  candidates!: CandidateCsvItemDto[];
}
