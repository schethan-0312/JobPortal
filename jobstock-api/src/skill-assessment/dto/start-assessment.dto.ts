import { IsString, MaxLength, MinLength } from 'class-validator';

export class StartAssessmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  skill!: string;
}
