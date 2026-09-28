import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('dashboard')
  getDashboardReport(@Req() request: any) {
    return this.reportsService.getDashboardReport(
      request.user.organizationId,
    );
  }

  @Get('opportunities')
  getOpportunitiesByStage(@Req() request: any) {
    return this.reportsService.getOpportunitiesByStage(
      request.user.organizationId,
    );
  }

  @Get('leads/status')
  getLeadsByStatus(@Req() request: any) {
    return this.reportsService.getLeadsByStatus(
      request.user.organizationId,
    );
  }

  @Get('leads/source')
  getLeadsBySource(@Req() request: any) {
    return this.reportsService.getLeadsBySource(
      request.user.organizationId,
    );
  }

  @Get('activities')
  getActivitiesReport(@Req() request: any) {
    return this.reportsService.getActivitiesReport(
      request.user.organizationId,
    );
  }

  @Get('tasks')
  getTasksReport(@Req() request: any) {
    return this.reportsService.getTasksReport(
      request.user.organizationId,
    );
  }

  @Get('quotations')
  getQuotationsReport(@Req() request: any) {
    return this.reportsService.getQuotationsReport(
      request.user.organizationId,
    );
  }

  @Get('products')
  getProductsReport(@Req() request: any) {
    return this.reportsService.getProductsReport(
      request.user.organizationId,
    );
  }
}