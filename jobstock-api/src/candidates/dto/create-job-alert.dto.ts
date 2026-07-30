import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJobAlertDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;
}
