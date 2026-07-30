import { IsEnum } from 'class-validator';
import { JobStatus } from '../../../generated/prisma/enums.js';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;
}
