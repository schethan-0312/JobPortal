import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  jobId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  coverNote?: string;
}
