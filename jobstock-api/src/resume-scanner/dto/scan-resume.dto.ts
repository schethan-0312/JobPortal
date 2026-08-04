import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ScanResumeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetRole?: string;
}
