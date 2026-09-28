import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardReport(organizationId: string) {
    const [
      totalCompanies,
      totalContacts,
      totalLeads,
      totalOpportunities,
      totalActivities,
      totalTasks,
      totalProducts,
      totalQuotations,
      wonOpportunities,
      pipelineValue,
      quotationValue,
    ] = await Promise.all([
      this.prisma.company.count({
        where: { organizationId },
      }),

      this.prisma.contact.count({
        where: { organizationId },
      }),

      this.prisma.lead.count({
        where: { organizationId },
      }),

      this.prisma.opportunity.count({
        where: { organizationId },
      }),

      this.prisma.activity.count({
        where: { organizationId },
      }),

      this.prisma.task.count({
        where: { organizationId },
      }),

      this.prisma.product.count({
        where: { organizationId },
      }),

      this.prisma.quotation.count({
        where: { organizationId },
      }),

      this.prisma.opportunity.aggregate({
        where: {
          organizationId,
          stage: 'CLOSED_WON',
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.opportunity.aggregate({
        where: {
          organizationId,
          stage: {
            notIn: ['CLOSED_WON', 'CLOSED_LOST'],
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.quotation.aggregate({
        where: {
          organizationId,
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    return {
      summary: {
        companies: totalCompanies,
        contacts: totalContacts,
        leads: totalLeads,
        opportunities: totalOpportunities,
        activities: totalActivities,
        tasks: totalTasks,
        products: totalProducts,
        quotations: totalQuotations,
      },

      sales: {
        wonRevenue: wonOpportunities._sum.amount ?? 0,
        pipelineValue: pipelineValue._sum.amount ?? 0,
        quotationValue: quotationValue._sum.total ?? 0,
      },
    };
  }

  async getOpportunitiesByStage(
    organizationId: string,
  ) {
    const results =
      await this.prisma.opportunity.groupBy({
        by: ['stage'],
        where: {
          organizationId,
        },
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });

    return results.map((item) => ({
      stage: item.stage,
      count: item._count.id,
      value: item._sum.amount ?? 0,
    }));
  }

  async getLeadsByStatus(
    organizationId: string,
  ) {
    const results =
      await this.prisma.lead.groupBy({
        by: ['status'],
        where: {
          organizationId,
        },
        _count: {
          id: true,
        },
      });

    return results.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));
  }

  async getLeadsBySource(
    organizationId: string,
  ) {
    const results =
      await this.prisma.lead.groupBy({
        by: ['source'],
        where: {
          organizationId,
        },
        _count: {
          id: true,
        },
      });

    return results.map((item) => ({
      source: item.source,
      count: item._count.id,
    }));
  }

  async getActivitiesReport(
    organizationId: string,
  ) {
    const results =
      await this.prisma.activity.groupBy({
        by: ['type', 'status'],
        where: {
          organizationId,
        },
        _count: {
          id: true,
        },
      });

    return results.map((item) => ({
      type: item.type,
      status: item.status,
      count: item._count.id,
    }));
  }

  async getTasksReport(
    organizationId: string,
  ) {
    const results =
      await this.prisma.task.groupBy({
        by: ['status', 'priority'],
        where: {
          organizationId,
        },
        _count: {
          id: true,
        },
      });

    return results.map((item) => ({
      status: item.status,
      priority: item.priority,
      count: item._count.id,
    }));
  }

  async getQuotationsReport(
    organizationId: string,
  ) {
    const results =
      await this.prisma.quotation.groupBy({
        by: ['status'],
        where: {
          organizationId,
        },
        _count: {
          id: true,
        },
        _sum: {
          total: true,
        },
      });

    return results.map((item) => ({
      status: item.status,
      count: item._count.id,
      value: item._sum.total ?? 0,
    }));
  }

  async getProductsReport(
    organizationId: string,
  ) {
    const totalProducts =
      await this.prisma.product.count({
        where: {
          organizationId,
        },
      });

    const activeProducts =
      await this.prisma.product.count({
        where: {
          organizationId,
          isActive: true,
        },
      });

    const inactiveProducts =
      await this.prisma.product.count({
        where: {
          organizationId,
          isActive: false,
        },
      });

    const byCategory =
      await this.prisma.product.groupBy({
        by: ['category'],
        where: {
          organizationId,
        },
        _count: {
          id: true,
        },
      });

    return {
      total: totalProducts,
      active: activeProducts,
      inactive: inactiveProducts,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        count: item._count.id,
      })),
    };
  }
}