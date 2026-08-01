import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { SystemConfigService } from './system-config.service.js';

// Auth and admin routes stay reachable during maintenance — otherwise no one
// (including the admin who flipped the switch) could log in to turn it back off.
const ALWAYS_ALLOWED_PREFIXES = ['/api/auth', '/api/admin'];

@Injectable()
export class MaintenanceModeMiddleware implements NestMiddleware {
  constructor(private readonly systemConfig: SystemConfigService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // req.path is relative to the sub-router NestJS mounts for the global
    // prefix (so it shows "/" here even for /api/admin/...) — originalUrl
    // still has the real incoming path, which is what we need to match.
    if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => req.originalUrl.startsWith(prefix))) {
      return next();
    }
    const maintenanceMode = await this.systemConfig.get('maintenanceMode');
    if (maintenanceMode) {
      const message = await this.systemConfig.get('maintenanceMessage');
      throw new ServiceUnavailableException(message);
    }
    next();
  }
}
