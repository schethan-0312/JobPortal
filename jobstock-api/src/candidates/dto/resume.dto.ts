import { IsString, IsOptional } from 'class-validator';

export class CreateEducationDto {
  @IsString()
  title: string;

  @IsString()
  academy: string;

  @IsString()
  year: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateExperienceDto {
  @IsString()
  title: string;

  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCertificationDto {
  @IsString()
  title: string;

  @IsString()
  year: string;

  @IsOptional()
  @IsString()
  description?: string;
}
