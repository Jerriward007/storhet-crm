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

import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.MANAGER,
    Role.SALES_REP,
    Role.USER,
  )
  async getMe(@Req() request: any) {
    return request.user;
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async createUser(
    @Req() request: any,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createUser(
      request.user.organizationId,
      dto,
    );
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async findAllUsers(@Req() request: any) {
    return this.usersService.findAllUsers(
      request.user.organizationId,
    );
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async findUserById(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.usersService.findUserById(
      request.user.organizationId,
      id,
    );
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateUser(
    @Req() request: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(
      request.user.organizationId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deleteUser(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.usersService.deleteUser(
      request.user.organizationId,
      id,
    );
  }
}