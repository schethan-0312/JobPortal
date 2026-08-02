import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpsertSeoSettingDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  ogImageUrl?: string;
}
