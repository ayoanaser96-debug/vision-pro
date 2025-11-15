import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async log(data: {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    description?: string;
    changes?: { before?: any; after?: any };
    ipAddress?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
