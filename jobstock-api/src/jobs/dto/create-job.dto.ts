import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobType, WorkMode, SalaryType } from '../../../generated/prisma/enums.js';

export class CreateJobDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  description!: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsString()
  @MaxLength(200)
  location!: string;

  @IsEnum(JobType)
  jobType!: JobType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100000000)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experienceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experienceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  openings?: number;

  @IsOptional()
  @IsBoolean()
  salaryVisible?: boolean;

  @IsOptional()
  @IsEnum(SalaryType)
  salaryType?: SalaryType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  locations?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  requiredSkills?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  requirements?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  niceToHave?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  benefits?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  screeningQuestions?: string[];

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;
}
