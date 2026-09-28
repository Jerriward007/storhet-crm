import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import {
  TaskPriority,
  TaskStatus,
} from '../generated/prisma/client.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    userId: string,
    createTaskDto: CreateTaskDto,
  ) {
    const assigneeId = createTaskDto.assigneeId ?? userId;

    await this.validateAssignee(organizationId, assigneeId);

    await this.validateRelations(organizationId, createTaskDto);

    const task = await this.prisma.task.create({
      data: {
        organizationId,
        assigneeId,

        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status ?? TaskStatus.TODO,
        priority: createTaskDto.priority ?? TaskPriority.MEDIUM,

        dueDate: createTaskDto.dueDate
          ? new Date(createTaskDto.dueDate)
          : undefined,

        companyId: createTaskDto.companyId,
        contactId: createTaskDto.contactId,
        leadId: createTaskDto.leadId,
        opportunityId: createTaskDto.opportunityId,
      },
      include: this.includeRelations(),
    });

    return task;
  }

  async findAll(
    organizationId: string,
    filters?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      companyId?: string;
      contactId?: string;
      leadId?: string;
      opportunityId?: string;
    },
  ) {
    return this.prisma.task.findMany({
      where: {
        organizationId,
        status: filters?.status,
        priority: filters?.priority,
        assigneeId: filters?.assigneeId,
        companyId: filters?.companyId,
        contactId: filters?.contactId,
        leadId: filters?.leadId,
        opportunityId: filters?.opportunityId,
      },
      include: this.includeRelations(),
      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findOne(organizationId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId,
      },
      include: this.includeRelations(),
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    organizationId: string,
    id: string,
    updateTaskDto: UpdateTaskDto,
  ) {
    await this.findOne(organizationId, id);

    if (updateTaskDto.assigneeId) {
      await this.validateAssignee(
        organizationId,
        updateTaskDto.assigneeId,
      );
    }

    await this.validateRelations(organizationId, updateTaskDto);

    const completedAt =
      updateTaskDto.status === TaskStatus.COMPLETED
        ? new Date()
        : updateTaskDto.status !== undefined
          ? null
          : undefined;

    return this.prisma.task.update({
      where: {
        id,
      },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        status: updateTaskDto.status,
        priority: updateTaskDto.priority,

        assigneeId: updateTaskDto.assigneeId,

        dueDate:
          updateTaskDto.dueDate !== undefined
            ? updateTaskDto.dueDate
              ? new Date(updateTaskDto.dueDate)
              : null
            : undefined,

        completedAt,

        companyId: updateTaskDto.companyId,
        contactId: updateTaskDto.contactId,
        leadId: updateTaskDto.leadId,
        opportunityId: updateTaskDto.opportunityId,
      },
      include: this.includeRelations(),
    });
  }

  async complete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.prisma.task.update({
      where: {
        id,
      },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: this.includeRelations(),
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Task deleted successfully',
    };
  }

  private async validateAssignee(
    organizationId: string,
    assigneeId: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: assigneeId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Assignee does not belong to this organization',
      );
    }
  }

  private async validateRelations(
    organizationId: string,
    dto: {
      companyId?: string;
      contactId?: string;
      leadId?: string;
      opportunityId?: string;
    },
  ) {
    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: dto.companyId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!company) {
        throw new BadRequestException(
          'Company does not belong to this organization',
        );
      }
    }

    if (dto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: dto.contactId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!contact) {
        throw new BadRequestException(
          'Contact does not belong to this organization',
        );
      }
    }

    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: {
          id: dto.leadId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!lead) {
        throw new BadRequestException(
          'Lead does not belong to this organization',
        );
      }
    }

    if (dto.opportunityId) {
      const opportunity = await this.prisma.opportunity.findFirst({
        where: {
          id: dto.opportunityId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!opportunity) {
        throw new BadRequestException(
          'Opportunity does not belong to this organization',
        );
      }
    }
  }

  private includeRelations() {
    return {
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      company: true,
      contact: true,
      lead: true,
      opportunity: true,
    };
  }
}