import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================================
  // CREATE ACTIVITY
  // =========================================================

  async create(
    organizationId: string,
    userId: string,
    createActivityDto: CreateActivityDto,
  ) {
    return this.prisma.activity.create({
      data: {
        organizationId,
        userId,

        type: createActivityDto.type as any,

        subject: createActivityDto.subject,

        description:
          createActivityDto.description ?? null,

        dueDate:
          createActivityDto.dueDate
            ? new Date(createActivityDto.dueDate)
            : null,

        companyId:
          createActivityDto.companyId ?? null,

        contactId:
          createActivityDto.contactId ?? null,

        leadId:
          createActivityDto.leadId ?? null,

        opportunityId:
          createActivityDto.opportunityId ?? null,
      },

      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },

        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        opportunity: {
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            currency: true,
          },
        },

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // =========================================================
  // FIND ALL ACTIVITIES
  // =========================================================

  async findAll(
    organizationId: string,
    filters?: {
      status?: string;
      type?: string;
      companyId?: string;
      contactId?: string;
      leadId?: string;
      opportunityId?: string;
    },
  ) {
    const activities = await this.prisma.activity.findMany({
      where: {
        organizationId,

        ...(filters?.status
          ? {
              status: filters.status as any,
            }
          : {}),

        ...(filters?.type
          ? {
              type: filters.type as any,
            }
          : {}),

        ...(filters?.companyId
          ? {
              companyId: filters.companyId,
            }
          : {}),

        ...(filters?.contactId
          ? {
              contactId: filters.contactId,
            }
          : {}),

        ...(filters?.leadId
          ? {
              leadId: filters.leadId,
            }
          : {}),

        ...(filters?.opportunityId
          ? {
              opportunityId: filters.opportunityId,
            }
          : {}),
      },

      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],

      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },

        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        opportunity: {
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            currency: true,
          },
        },

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      value: activities,
      Count: activities.length,
    };
  }

  // =========================================================
  // FIND ONE ACTIVITY
  // =========================================================

  async findOne(
    organizationId: string,
    id: string,
  ) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id,
        organizationId,
      },

      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },

        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        opportunity: {
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            currency: true,
          },
        },

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  // =========================================================
  // UPDATE ACTIVITY
  // =========================================================

  async update(
    organizationId: string,
    id: string,
    updateActivityDto: UpdateActivityDto,
  ) {
    // First make sure the activity belongs to this organization.
    const existingActivity =
      await this.prisma.activity.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!existingActivity) {
      throw new NotFoundException('Activity not found');
    }

    const data: any = {};

    if (updateActivityDto.type !== undefined) {
      data.type = updateActivityDto.type as any;
    }

    if (updateActivityDto.subject !== undefined) {
      data.subject = updateActivityDto.subject;
    }

    if (updateActivityDto.description !== undefined) {
      data.description =
        updateActivityDto.description;
    }

    if (updateActivityDto.dueDate !== undefined) {
      data.dueDate =
        updateActivityDto.dueDate
          ? new Date(updateActivityDto.dueDate)
          : null;
    }

    if (updateActivityDto.companyId !== undefined) {
      data.companyId =
        updateActivityDto.companyId;
    }

    if (updateActivityDto.contactId !== undefined) {
      data.contactId =
        updateActivityDto.contactId;
    }

    if (updateActivityDto.leadId !== undefined) {
      data.leadId =
        updateActivityDto.leadId;
    }

    if (updateActivityDto.opportunityId !== undefined) {
      data.opportunityId =
        updateActivityDto.opportunityId;
    }

    // Use status instead of the old/non-existent
    // "completed" field.
    if (
      (updateActivityDto as any).status !== undefined
    ) {
      data.status =
        (updateActivityDto as any).status;

      if (
        (updateActivityDto as any).status ===
        'COMPLETED'
      ) {
        data.completedAt = new Date();
      }

      if (
        (updateActivityDto as any).status ===
        'PENDING'
      ) {
        data.completedAt = null;
      }
    }

    return this.prisma.activity.update({
      where: {
        id,
      },

      data,

      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },

        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        opportunity: {
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            currency: true,
          },
        },

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // =========================================================
  // COMPLETE ACTIVITY
  // =========================================================

  async complete(
    organizationId: string,
    id: string,
  ) {
    const existingActivity =
      await this.prisma.activity.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!existingActivity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.activity.update({
      where: {
        id,
      },

      data: {
        status: 'COMPLETED' as any,
        completedAt: new Date(),
      },

      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },

        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        opportunity: {
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            currency: true,
          },
        },

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // =========================================================
  // DELETE / ARCHIVE ACTIVITY
  // =========================================================

  async remove(
    organizationId: string,
    id: string,
  ) {
    const existingActivity =
      await this.prisma.activity.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!existingActivity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.activity.update({
      where: {
        id,
      },

      data: {
        isArchived: true,
      },
    });
  }
}