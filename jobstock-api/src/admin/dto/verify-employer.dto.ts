import { IsEnum } from 'class-validator';

export enum VerifyDecision {
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export class VerifyEmployerDto {
  @IsEnum(VerifyDecision)
  decision!: VerifyDecision;
}
