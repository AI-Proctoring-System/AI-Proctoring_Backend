import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50, { message: 'Password cannot exceed 50 characters' })
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName!: string;

  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MaxLength(100, { message: 'Company name cannot exceed 100 characters' })
  companyName!: string;
}
