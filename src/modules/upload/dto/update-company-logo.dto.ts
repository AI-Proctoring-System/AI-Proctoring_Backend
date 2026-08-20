import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCompanyLogoDto {
  @ApiProperty({
    description: 'Base64 encoded Data URL of the company logo',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
  })
  @IsNotEmpty()
  @IsString()
  logoDataUrl: string;
}
