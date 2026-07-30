import { IsString, MaxLength, MinLength } from 'class-validator';

export class StartInterviewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  jobRole!: string;
}
