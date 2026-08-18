import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class UpdateRulesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxTabSwitches?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSubmitOnTimeout?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  identityVerificationEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  personDetectionEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  objectDetectionEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  headGazeMonitoringEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  voiceMonitoringEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  browserMonitoringEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fullscreenMonitoringEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  copyPasteMonitoringEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  headMovementThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  voiceThresholdSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  objectDetectionDurationSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  personDetectionDurationSec?: number;
}
