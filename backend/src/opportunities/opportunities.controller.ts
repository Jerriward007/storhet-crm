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

import { CreateOpportunityDto } from './dto/create-opportunity.dto.js';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto.js';
import { OpportunitiesService } from './opportunities.service.js';

@Controller('opportunities')
@UseGuards(JwtAuthGuard)
export class OpportunitiesController {
  constructor(
    private readonly opportunitiesService: OpportunitiesService,
  ) {}

  @Post()
  create(
    @Req() request: any,
    @Body() createOpportunityDto: CreateOpportunityDto,
  ) {
    return this.opportunitiesService.create(
      request.user.organizationId,
      createOpportunityDto,
    );
  }

  @Get()
  findAll(
    @Req() request: any,
    @Query('stage') stage?: string,
    @Query('ownerId') ownerId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.opportunitiesService.findAll(
      request.user.organizationId,
      stage,
      ownerId,
      companyId,
    );
  }

  @Get(':id')
  findOne(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.opportunitiesService.findOne(
      request.user.organizationId,
      id,
    );
  }

  @Patch(':id')
  update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateOpportunityDto: UpdateOpportunityDto,
  ) {
    return this.opportunitiesService.update(
      request.user.organizationId,
      id,
      updateOpportunityDto,
    );
  }

  @Delete(':id')
  remove(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.opportunitiesService.remove(
      request.user.organizationId,
      id,
    );
  }
}