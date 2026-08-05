import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ScanSourceType {
  SAVED = 'saved',
  UPLOAD = 'upload',
  PASTE = 'paste',
}

export class ScanResumeDto {
  @IsEnum(ScanSourceType)
  sourceType: ScanSourceType;

  @IsOptional()
  @IsString()
  pastedText?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  jobDescription?: string;
}
