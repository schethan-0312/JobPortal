import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertLegalDocumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(50000)
  body!: string;
}
