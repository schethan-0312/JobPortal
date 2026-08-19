import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateJobAssessmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @IsNotEmpty()
  questions: any[];

  @IsOptional()
  @IsNumber()
  timeLimitMinutes?: number;
}
