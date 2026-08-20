import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyProfileDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ example: 'Acme Corp Updated', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @ApiProperty({ example: 'info@acme.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  companyEmail?: string;

  @ApiProperty({ example: 'https://acme.com', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  websiteUrl?: string;

  @ApiProperty({ example: 'A leading tech provider.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'data:image/png;base64,...', required: false })
  @IsOptional()
  @IsString()
  logoDataUrl?: string;
}
