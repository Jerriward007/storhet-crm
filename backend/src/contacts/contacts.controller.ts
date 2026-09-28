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
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';

import { CreateContactDto } from './dto/create-contact.dto.js';
import { UpdateContactDto } from './dto/update-contact.dto.js';
import { ContactsService } from './contacts.service.js';

@Controller('contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async createContact(
    @Req() request: any,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.createContact(
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
  async findAllContacts(
    @Req() request: any,
    @Query('companyId') companyId?: string,
  ) {
    return this.contactsService.findAllContacts(
      request.user.organizationId,
      companyId,
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
  async findContactById(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.contactsService.findContactById(
      request.user.organizationId,
      id,
    );
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async updateContact(
    @Req() request: any,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.updateContact(
      request.user.organizationId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async archiveContact(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.contactsService.archiveContact(
      request.user.organizationId,
      id,
    );
  }
}