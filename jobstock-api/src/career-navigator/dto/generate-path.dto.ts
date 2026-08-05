import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GeneratePathDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetIndustry?: string;

  @IsOptional()
  @IsString()
  sourceType?: 'profile' | 'resume' | 'upload' = 'profile';

  @IsOptional()
  @IsString()
  sourceText?: string;
}
