import { IsIP, IsOptional, IsString } from 'class-validator';

export class BlockIpDto {
  @IsIP()
  ipAddress!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
