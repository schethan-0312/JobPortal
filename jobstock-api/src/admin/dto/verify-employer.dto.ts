import { IsEnum } from 'class-validator';

export enum VerifyDecision {
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export class VerifyEmployerDto {
  @IsEnum(VerifyDecision)
  decision!: VerifyDecision;
}
