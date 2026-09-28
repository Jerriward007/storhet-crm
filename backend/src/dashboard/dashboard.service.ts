import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(organizationId: string) {
    const [
      companies,
      contacts,
      leads,
      opportunities,
      activities,
      tasks,
      products,
      quotations,
      wonOpportunities,
      openOpportunities,
      openTasks,
      pendingActivities,
      quotationTotals,
      recentOpportunities,
      recentLeads,
      recentActivities,
      recentTasks,
      recentQuotations,
    ] = await Promise.all([
      this.prisma.company.count({
        where: {
          organizationId,
          isArchived: false,
        },
      }),

      this.prisma.contact.count({
        where: {
          organizationId,
          isArchived: false,
        },
      }),

      this.prisma.lead.count({
        where: {
          organizationId,
          isArchived: false,
        },
      }),

      this.prisma.opportunity.count({
        where: {
          organizationId,
          isArchived: false,
        },
      }),

      this.prisma.activity.count({
        where: {
          organizationId,
        },
      }),

      this.prisma.task.count({
        where: {
          organizationId,
        },
      }),

      this.prisma.product.count({
        where: {
          organizationId,
          isActive: true,
        },
      }),

      this.prisma.quotation.count({
        where: {
          organizationId,
        },
      }),

      this.prisma.opportunity.aggregate({
        where: {
          organizationId,
          isArchived: false,
          stage: 'CLOSED_WON',
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.opportunity.count({
        where: {
          organizationId,
          isArchived: false,
          stage: {
            notIn: ['CLOSED_WON', 'CLOSED_LOST'],
          },
        },
      }),

      this.prisma.task.count({
        where: {
          organizationId,
          status: {
            in: ['TODO', 'IN_PROGRESS'],
          },
        },
      }),

      this.prisma.activity.count({
        where: {
          organizationId,
          status: 'PENDING',
        },
      }),

      this.prisma.quotation.aggregate({
        where: {
          organizationId,
        },
        _sum: {
          subtotal: true,
          tax: true,
          discount: true,
          total: true,
        },
      }),

      this.prisma.opportunity.findMany({
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
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      this.prisma.lead.findMany({
        where: {
          organizationId,
          isArchived: false,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          source: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      this.prisma.activity.findMany({
        where: {
          organizationId,
        },
        select: {
          id: true,
          type: true,
          status: true,
          subject: true,
          dueDate: true,
          completedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      this.prisma.task.findMany({
        where: {
          organizationId,
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
          createdAt: true,
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      this.prisma.quotation.findMany({
        where: {
          organizationId,
        },
        select: {
          id: true,
          quotationNumber: true,
          title: true,
          status: true,
          currency: true,
          total: true,
          validUntil: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    const leadConversionBase = await this.prisma.lead.count({
      where: {
        organizationId,
        isArchived: false,
        status: {
          not: 'NEW',
        },
      },
    });

    const convertedLeads = await this.prisma.lead.count({
      where: {
        organizationId,
        isArchived: false,
        status: 'CONVERTED',
      },
    });

    const leadConversionRate =
      leadConversionBase > 0
        ? Number(
            (
              (convertedLeads / leadConversionBase) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      cards: {
        companies,
        contacts,
        leads,
        opportunities,
        activities,
        tasks,
        activeProducts: products,
        quotations,
      },

      sales: {
        wonRevenue:
          wonOpportunities._sum.amount ?? 0,
        openOpportunities,
        quotationValue:
          quotationTotals._sum.total ?? 0,
      },

      activity: {
        pendingActivities,
        openTasks,
      },

      leadConversion: {
        converted: convertedLeads,
        considered: leadConversionBase,
        rate: leadConversionRate,
      },

      quotationTotals: {
        subtotal:
          quotationTotals._sum.subtotal ?? 0,
        tax:
          quotationTotals._sum.tax ?? 0,
        discount:
          quotationTotals._sum.discount ?? 0,
        total:
          quotationTotals._sum.total ?? 0,
      },

      recent: {
        opportunities: recentOpportunities,
        leads: recentLeads,
        activities: recentActivities,
        tasks: recentTasks,
        quotations: recentQuotations,
      },
    };
  }
}