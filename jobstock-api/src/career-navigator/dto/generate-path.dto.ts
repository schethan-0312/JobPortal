import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GeneratePathDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetIndustry?: string;
}
