import { IsEmail, IsEnum } from 'class-validator';
import { AdminRole } from '../../../generated/prisma/enums.js';

export class InviteAdminDto {
  @IsEmail()
  email!: string;

  @IsEnum(AdminRole)
  adminRole!: AdminRole;
}
