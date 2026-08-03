import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const FILE_PATH_OR_URL = { message: 'must be a valid URL or an uploaded file path' };

export class ExperienceEntryDto {
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsString()
  @MaxLength(150)
  company!: string;

  @IsString()
  @MaxLength(50)
  startDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class EducationEntryDto {
  @IsString()
  @MaxLength(150)
  degree!: string;

  @IsString()
  @MaxLength(150)
  institution!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  startYear?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  endYear?: string;
}

export class UpdateCandidateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  about?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, FILE_PATH_OR_URL)
  resumeUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, FILE_PATH_OR_URL)
  profilePhotoUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, FILE_PATH_OR_URL)
  videoProfileUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experienceEntries?: ExperienceEntryDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EducationEntryDto)
  educationEntries?: EducationEntryDto[];
}
