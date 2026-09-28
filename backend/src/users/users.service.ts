import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(
    organizationId: string,
    dto: CreateUserDto,
  ) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        organizationId,
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User already exists in this organization',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      12,
    );

    return this.prisma.user.create({
      data: {
        organizationId,
        email,
        password: passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async findAllUsers(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findUserById(
    organizationId: string,
    userId: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    organizationId: string,
    userId: string,
    dto: UpdateUserDto,
  ) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(dto.firstName !== undefined && {
          firstName: dto.firstName,
        }),
        ...(dto.lastName !== undefined && {
          lastName: dto.lastName,
        }),
        ...(dto.role !== undefined && {
          role: dto.role,
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(
    organizationId: string,
    userId: string,
  ) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return {
      message: 'User deleted successfully',
    };
  }
}