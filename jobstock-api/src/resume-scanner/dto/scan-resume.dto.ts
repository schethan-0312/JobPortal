import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ScanResumeDto {
  @IsString()
  @MinLength(50, { message: 'Resume text is too short to analyze meaningfully' })
  @MaxLength(20000)
  resumeText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetRole?: string;
}
