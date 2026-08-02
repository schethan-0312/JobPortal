import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  maintenanceMessage?: string;

  @IsOptional()
  @IsBoolean()
  registrationEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supportEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxJobPostsPerEmployer?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  platformAnnouncement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoDefaultTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDefaultDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  seoRobotsTxt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoGoogleSiteVerification?: string;
}
