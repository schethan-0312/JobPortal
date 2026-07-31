import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class OverrideSubscriptionDto {
  @IsString()
  @MinLength(5)
  reason!: string;

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
