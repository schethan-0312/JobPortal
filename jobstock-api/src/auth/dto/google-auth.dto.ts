import { IsNotEmpty, IsOptional, IsEnum, IsString } from 'class-validator';
import { Role } from '../../../generated/prisma/enums.js';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  credential!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  isLogin?: boolean;
}
