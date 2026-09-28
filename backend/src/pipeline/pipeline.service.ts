import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId: string) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        organizationId,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        stage: true,
        probability: true,
        expectedCloseDate: true,
        companyId: true,
        ownerId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const stages = [
      'PROSPECTING',
      'QUALIFICATION',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST',
    ] as const;

    const stageSummary = stages.map((stage) => {
      const stageOpportunities = opportunities.filter(
        (opportunity) => opportunity.stage === stage,
      );

      const totalValue = stageOpportunities.reduce(
        (sum, opportunity) => {
          return sum + Number(opportunity.amount ?? 0);
        },
        0,
      );

      const weightedValue = stageOpportunities.reduce(
        (sum, opportunity) => {
          const amount = Number(opportunity.amount ?? 0);
          const probability = opportunity.probability ?? 0;

          return sum + amount * (probability / 100);
        },
        0,
      );

      return {
        stage,
        dealCount: stageOpportunities.length,
        totalValue,
        weightedValue,
      };
    });

    const activeOpportunities = opportunities.filter(
      (opportunity) =>
        opportunity.stage !== 'CLOSED_WON' &&
        opportunity.stage !== 'CLOSED_LOST',
    );

    const totalPipelineValue = activeOpportunities.reduce(
      (sum, opportunity) => {
        return sum + Number(opportunity.amount ?? 0);
      },
      0,
    );

    const weightedPipelineValue = activeOpportunities.reduce(
      (sum, opportunity) => {
        const amount = Number(opportunity.amount ?? 0);
        const probability = opportunity.probability ?? 0;

        return sum + amount * (probability / 100);
      },
      0,
    );

    const wonOpportunities = opportunities.filter(
      (opportunity) => opportunity.stage === 'CLOSED_WON',
    );

    const lostOpportunities = opportunities.filter(
      (opportunity) => opportunity.stage === 'CLOSED_LOST',
    );

    const wonValue = wonOpportunities.reduce(
      (sum, opportunity) => {
        return sum + Number(opportunity.amount ?? 0);
      },
      0,
    );

    const lostValue = lostOpportunities.reduce(
      (sum, opportunity) => {
        return sum + Number(opportunity.amount ?? 0);
      },
      0,
    );

    return {
      summary: {
        totalDeals: opportunities.length,
        activeDeals: activeOpportunities.length,
        totalPipelineValue,
        weightedPipelineValue,
        wonDeals: wonOpportunities.length,
        wonValue,
        lostDeals: lostOpportunities.length,
        lostValue,
      },

      stages: stageSummary,

      opportunities,
    };
  }

  async getStage(
    organizationId: string,
    stage: string,
  ) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        organizationId,
        isArchived: false,
        stage: stage as any,
      },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        stage: true,
        probability: true,
        expectedCloseDate: true,
        companyId: true,
        contactId: true,
        ownerId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalValue = opportunities.reduce(
      (sum, opportunity) => {
        return sum + Number(opportunity.amount ?? 0);
      },
      0,
    );

    const weightedValue = opportunities.reduce(
      (sum, opportunity) => {
        const amount = Number(opportunity.amount ?? 0);
        const probability = opportunity.probability ?? 0;

        return sum + amount * (probability / 100);
      },
      0,
    );

    return {
      stage,
      dealCount: opportunities.length,
      totalValue,
      weightedValue,
      opportunities,
    };
  }

  async moveOpportunity(
    organizationId: string,
    opportunityId: string,
    stage: string,
  ) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId,
        isArchived: false,
      },
    });

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const probabilityByStage: Record<string, number> = {
      PROSPECTING: 10,
      QUALIFICATION: 30,
      PROPOSAL: 50,
      NEGOTIATION: 70,
      CLOSED_WON: 100,
      CLOSED_LOST: 0,
    };

    const probability = probabilityByStage[stage];

    return this.prisma.opportunity.update({
      where: {
        id: opportunityId,
      },

      data: {
        stage: stage as any,
        probability,
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
}