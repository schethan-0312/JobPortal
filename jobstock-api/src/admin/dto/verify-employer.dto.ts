import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum VerifyDecision {
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  INFO_REQUESTED = 'INFO_REQUESTED',
}

export class VerifyEmployerDto {
  @IsEnum(VerifyDecision)
  decision!: VerifyDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  requestedDocuments?: string[];
}
