import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class RefundTransactionDto {
  @IsString()
  @MinLength(5)
  reason!: string;

  /** Optional partial-refund amount in paisa. If omitted, refunds the full order amount. */
  @IsOptional()
  @IsInt()
  @Min(1)
  amountInPaisa?: number;
}
