import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';

export class SubmitAssessmentDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @Min(0, { each: true })
  answers!: number[];

  /** Count of tab-switch/window-blur events detected client-side during the test. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  violations?: number;
}
