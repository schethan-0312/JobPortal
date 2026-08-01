import { Injectable } from '@nestjs/common';
import { SystemConfigService, SystemConfigKey } from '../system-config/system-config.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditTargetType } from '../../generated/prisma/enums.js';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto.js';

@Injectable()
export class AdminSystemConfigService {
  constructor(
    private readonly systemConfig: SystemConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  getAll() {
    return this.systemConfig.getAll();
  }

  async update(actorId: string, dto: UpdateSystemConfigDto, ip?: string) {
    const entries = Object.entries(dto) as [SystemConfigKey, unknown][];
    for (const [key, value] of entries) {
      if (value === undefined) continue;
      await this.systemConfig.set(key, value, actorId);
      await this.auditLog.log({
        adminId: actorId,
        action: 'SYSTEM_CONFIG_UPDATED',
        targetType: AuditTargetType.CONFIG,
        targetId: key,
        metadata: { value },
        ipAddress: ip,
      });
    }
    return this.systemConfig.getAll();
  }
}
