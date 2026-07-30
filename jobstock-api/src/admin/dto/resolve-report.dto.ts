import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}
