import { IsNotEmpty, IsString } from 'class-validator';

export class SuggestImprovementDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  sectionType: string;
}
