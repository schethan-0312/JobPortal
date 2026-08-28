import { IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class UpdateEmployerDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, { message: 'logoUrl must be a valid URL or an uploaded file path' })
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, { message: 'Must be a valid URL or an uploaded file path' })
  gstCertificateUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, { message: 'Must be a valid URL or an uploaded file path' })
  incorporationCertUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, { message: 'Must be a valid URL or an uploaded file path' })
  signatoryIdUrl?: string;
}
