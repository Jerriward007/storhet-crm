import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { LeadsService } from './leads.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
  ) {}

  @Post()
  create(
    @Req() request: any,
    @Body() createLeadDto: CreateLeadDto,
  ) {
    return this.leadsService.create(
      request.user.organizationId,
      createLeadDto,
    );
  }

  @Get()
  findAll(
    @Req() request: any,
    @Query('status') status?: string,
    @Query('source') source?: string,
  ) {
    return this.leadsService.findAll(
      request.user.organizationId,
      status,
      source,
    );
  }

  @Get(':id')
  findOne(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.leadsService.findOne(
      request.user.organizationId,
      id,
    );
  }

  @Patch(':id')
  update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(
      request.user.organizationId,
      id,
      updateLeadDto,
    );
  }

  @Delete(':id')
  remove(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.leadsService.remove(
      request.user.organizationId,
      id,
    );
  }
}