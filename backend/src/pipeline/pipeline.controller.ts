import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto.js';
import { PipelineService } from './pipeline.service.js';

@Controller('pipeline')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(
    private readonly pipelineService: PipelineService,
  ) {}

  @Get()
  getSummary(@Req() request: any) {
    return this.pipelineService.getSummary(
      request.user.organizationId,
    );
  }

  @Get('stage/:stage')
  getStage(
    @Req() request: any,
    @Param('stage') stage: string,
  ) {
    return this.pipelineService.getStage(
      request.user.organizationId,
      stage,
    );
  }

  @Patch('opportunities/:id/stage')
  moveOpportunity(
    @Req() request: any,
    @Param('id') opportunityId: string,
    @Body() updatePipelineStageDto: UpdatePipelineStageDto,
  ) {
    return this.pipelineService.moveOpportunity(
      request.user.organizationId,
      opportunityId,
      updatePipelineStageDto.stage,
    );
  }
}