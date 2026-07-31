import { IsEnum } from 'class-validator';
import { AdminRole } from '../../../generated/prisma/enums.js';

export class UpdateAdminRoleDto {
  @IsEnum(AdminRole)
  adminRole!: AdminRole;
}
