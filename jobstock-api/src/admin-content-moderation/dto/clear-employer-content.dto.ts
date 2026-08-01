import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const CLEARABLE_FIELDS = ['description', 'cultureBlurb'] as const;

export class ClearEmployerContentDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(CLEARABLE_FIELDS, { each: true })
  fields!: ('description' | 'cultureBlurb')[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
