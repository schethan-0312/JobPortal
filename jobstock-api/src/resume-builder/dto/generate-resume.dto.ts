import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateResumeDto {
  @IsString()
  @MinLength(20, { message: 'Tell us a bit more about your experience and education' })
  @MaxLength(5000)
  rawBackground!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetRole?: string;
}
