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

import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { ActivitiesService } from './activities.service.js';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
  ) {}

  @Post()
  create(
    @Req() request: any,
    @Body() createActivityDto: CreateActivityDto,
  ) {
    return this.activitiesService.create(
      request.user.organizationId,
      request.user.id,
      createActivityDto,
    );
  }

  @Get()
  findAll(
    @Req() request: any,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('companyId') companyId?: string,
    @Query('contactId') contactId?: string,
    @Query('leadId') leadId?: string,
    @Query('opportunityId') opportunityId?: string,
  ) {
    return this.activitiesService.findAll(
      request.user.organizationId,
      {
        status,
        type,
        companyId,
        contactId,
        leadId,
        opportunityId,
      },
    );
  }

  @Get(':id')
  findOne(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.activitiesService.findOne(
      request.user.organizationId,
      id,
    );
  }

  @Patch(':id')
  update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(
      request.user.organizationId,
      id,
      updateActivityDto,
    );
  }

  @Patch(':id/complete')
  complete(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.activitiesService.complete(
      request.user.organizationId,
      id,
    );
  }

  @Delete(':id')
  remove(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.activitiesService.remove(
      request.user.organizationId,
      id,
    );
  }
}