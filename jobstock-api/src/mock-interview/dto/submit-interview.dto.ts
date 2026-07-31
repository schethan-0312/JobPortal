import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SubmitInterviewDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(3000, { each: true })
  answers!: string[];

  /** Count of tab-switch/window-blur/paste events detected client-side during the interview. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  violations?: number;
}
