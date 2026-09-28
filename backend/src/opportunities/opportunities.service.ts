import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOpportunityDto } from './dto/create-opportunity.dto.js';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto.js';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createOpportunityDto: CreateOpportunityDto,
  ) {
    await this.validateReferences(
      organizationId,
      createOpportunityDto.companyId,
      createOpportunityDto.contactId,
      createOpportunityDto.ownerId,
    );

    return this.prisma.opportunity.create({
      data: {
        organizationId,
        companyId: createOpportunityDto.companyId,
        contactId: createOpportunityDto.contactId,
        ownerId: createOpportunityDto.ownerId,

        name: createOpportunityDto.name,
        description: createOpportunityDto.description,

        amount: createOpportunityDto.amount,
        currency: createOpportunityDto.currency,

        stage: createOpportunityDto.stage,
        probability: createOpportunityDto.probability,

        expectedCloseDate: createOpportunityDto.expectedCloseDate
          ? new Date(createOpportunityDto.expectedCloseDate)
          : undefined,

        notes: createOpportunityDto.notes,
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

        owner: {
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
    stage?: string,
    ownerId?: string,
    companyId?: string,
  ) {
    return this.prisma.opportunity.findMany({
      where: {
        organizationId,
        isArchived: false,

        ...(stage
          ? {
              stage: stage as any,
            }
          : {}),

        ...(ownerId
          ? {
              ownerId,
            }
          : {}),

        ...(companyId
          ? {
              companyId,
            }
          : {}),
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

        owner: {
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
    const opportunity = await this.prisma.opportunity.findFirst({
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

        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    return opportunity;
  }

  async update(
    organizationId: string,
    id: string,
    updateOpportunityDto: UpdateOpportunityDto,
  ) {
    await this.findOne(organizationId, id);

    await this.validateReferences(
      organizationId,
      updateOpportunityDto.companyId,
      updateOpportunityDto.contactId,
      updateOpportunityDto.ownerId,
    );

    return this.prisma.opportunity.update({
      where: {
        id,
      },

      data: {
        companyId: updateOpportunityDto.companyId,
        contactId: updateOpportunityDto.contactId,
        ownerId: updateOpportunityDto.ownerId,

        name: updateOpportunityDto.name,
        description: updateOpportunityDto.description,

        amount: updateOpportunityDto.amount,
        currency: updateOpportunityDto.currency,

        stage: updateOpportunityDto.stage,
        probability: updateOpportunityDto.probability,

        expectedCloseDate:
          updateOpportunityDto.expectedCloseDate !== undefined
            ? new Date(updateOpportunityDto.expectedCloseDate)
            : undefined,

        notes: updateOpportunityDto.notes,
        isArchived: updateOpportunityDto.isArchived,
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

        owner: {
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

    return this.prisma.opportunity.update({
      where: {
        id,
      },

      data: {
        isArchived: true,
      },
    });
  }

  private async validateReferences(
    organizationId: string,
    companyId?: string,
    contactId?: string,
    ownerId?: string,
  ) {
    if (companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: companyId,
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

    if (contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: contactId,
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

    const owner = await this.prisma.user.findFirst({
      where: {
        id: ownerId,
        organizationId,
      },
    });

    if (!owner) {
      throw new BadRequestException(
        'Opportunity owner not found in your organization',
      );
    }
  }
}