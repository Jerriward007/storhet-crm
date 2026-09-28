import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';

import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { CompaniesService } from './companies.service.js';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async createCompany(
    @Req() request: any,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.createCompany(
      request.user.organizationId,
      dto,
    );
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.MANAGER,
    Role.SALES_REP,
    Role.USER,
  )
  async findAllCompanies(@Req() request: any) {
    return this.companiesService.findAllCompanies(
      request.user.organizationId,
    );
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.MANAGER,
    Role.SALES_REP,
    Role.USER,
  )
  async findCompanyById(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.companiesService.findCompanyById(
      request.user.organizationId,
      id,
    );
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async updateCompany(
    @Req() request: any,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(
      request.user.organizationId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async archiveCompany(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.companiesService.archiveCompany(
      request.user.organizationId,
      id,
    );
  }
}