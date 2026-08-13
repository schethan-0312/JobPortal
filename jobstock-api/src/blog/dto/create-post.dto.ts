import { IsOptional, IsString, IsUrl, MaxLength, MinLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsString()
  @MinLength(20)
  body!: string;

  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  servicePageLink?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readTimeMinutes?: number;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  images?: string[];

  @IsOptional()
  @IsString()
  status?: string; // 'draft' or 'published'

  @IsOptional()
  @IsString()
  author?: string;
}
