import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createLeadDto: CreateLeadDto,
  ) {
    if (createLeadDto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: createLeadDto.companyId,
          organizationId,
          isArchived: false,
        },
      });

      if (!company) {
        throw new BadRequestException(
          'Company not found in your organization',
        );
      }
    }

    if (createLeadDto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: createLeadDto.contactId,
          organizationId,
          isArchived: false,
        },
      });

      if (!contact) {
        throw new BadRequestException(
          'Contact not found in your organization',
        );
      }
    }

    return this.prisma.lead.create({
      data: {
        organizationId,
        companyId: createLeadDto.companyId,
        contactId: createLeadDto.contactId,
        firstName: createLeadDto.firstName,
        lastName: createLeadDto.lastName,
        email: createLeadDto.email,
        phone: createLeadDto.phone,
        jobTitle: createLeadDto.jobTitle,
        source: createLeadDto.source,
        status: createLeadDto.status,
        notes: createLeadDto.notes,
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
      },
    });
  }

  async findAll(
    organizationId: string,
    status?: string,
    source?: string,
  ) {
    return this.prisma.lead.findMany({
      where: {
        organizationId,
        isArchived: false,
        ...(status ? { status: status as any } : {}),
        ...(source ? { source: source as any } : {}),
      },
      orderBy: {
        createdAt: 'desc',
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
      },
    });
  }

  async findOne(
    organizationId: string,
    id: string,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId,
        isArchived: false,
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
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async update(
    organizationId: string,
    id: string,
    updateLeadDto: UpdateLeadDto,
  ) {
    await this.findOne(organizationId, id);

    if (updateLeadDto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: updateLeadDto.companyId,
          organizationId,
          isArchived: false,
        },
      });

      if (!company) {
        throw new BadRequestException(
          'Company not found in your organization',
        );
      }
    }

    if (updateLeadDto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: updateLeadDto.contactId,
          organizationId,
          isArchived: false,
        },
      });

      if (!contact) {
        throw new BadRequestException(
          'Contact not found in your organization',
        );
      }
    }

    return this.prisma.lead.update({
      where: {
        id,
      },
      data: updateLeadDto,
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
      },
    });
  }

  async remove(
    organizationId: string,
    id: string,
  ) {
    await this.findOne(organizationId, id);

    return this.prisma.lead.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    });
  }
}