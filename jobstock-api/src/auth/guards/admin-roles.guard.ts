import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator.js';
import { AdminRole } from '../../../generated/prisma/enums.js';

/// Applies only to admin sub-permissions (SUPER_ADMIN / SUPPORT_ADMIN / etc).
/// Must run after RolesGuard has already confirmed role = ADMIN.
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAdminRoles = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredAdminRoles || requiredAdminRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredAdminRoles.includes(user.adminRole)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }
    return true;
  }
}
