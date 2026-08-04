import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SyncEducationDto {
  @IsString()
  title!: string;

  @IsString()
  academy!: string;

  @IsString()
  year!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SyncExperienceDto {
  @IsString()
  title!: string;

  @IsString()
  company!: string;

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

export class SyncProjectDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SyncCertificationDto {
  @IsString()
  title!: string;

  @IsString()
  year!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SyncResumeDataDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEducationDto)
  educations?: SyncEducationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncExperienceDto)
  experiences?: SyncExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncProjectDto)
  projects?: SyncProjectDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCertificationDto)
  certifications?: SyncCertificationDto[];
}
