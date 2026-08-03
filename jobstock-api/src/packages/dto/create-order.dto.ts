import { IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  packageId!: string;

  /// Required when purchasing a JOB_BOOST package — which job to feature.
  @IsOptional()
  @IsString()
  jobId?: string;
}
