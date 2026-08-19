import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus, JobType } from '../../../generated/prisma/enums.js';

export class CreateJobDto {
  // 1. Basic Job Details
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobRole?: string;

  @IsEnum(JobType)
  jobType!: JobType;

  // 2. Job Description
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  responsibilities?: string;

  // 3. Skills & Experience
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  minExperience?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  maxExperience?: number;

  // 4. Education & Qualification
  @IsOptional()
  @IsString()
  @MaxLength(150)
  minQualification?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  specialization?: string;

  // 5. Salary & Location
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
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  salaryPeriod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  workMode?: string;

  // 6. Candidate Preferences
  @IsOptional()
  @IsString()
  @MaxLength(100)
  noticePeriod?: string;

  @IsOptional()
  @IsBoolean()
  willingnessToRelocate?: boolean;

  @IsOptional()
  @IsBoolean()
  willingnessToTravel?: boolean;

  // 7. Job Openings
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  openings?: number;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  // 8. Screening Questions
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screeningQuestions?: string[];

  // 10. Publishing
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
