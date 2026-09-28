import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(
    organizationId: string,
    dto: CreateCompanyDto,
  ) {
    const name = dto.name.trim();

    const existingCompany = await this.prisma.company.findFirst({
      where: {
        organizationId,
        name,
      },
    });

    if (existingCompany) {
      throw new ConflictException(
        'A company with this name already exists in this organization',
      );
    }

    return this.prisma.company.create({
      data: {
        organizationId,
        name,
        industry: dto.industry,
        website: dto.website,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        notes: dto.notes,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        industry: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        country: true,
        notes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAllCompanies(organizationId: string) {
    return this.prisma.company.findMany({
      where: {
        organizationId,
        isArchived: false,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        industry: true,
        website: true,
        phone: true,
        email: true,
        city: true,
        state: true,
        country: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findCompanyById(
    organizationId: string,
    companyId: string,
  ) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        organizationId,
        isArchived: false,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        industry: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        country: true,
        notes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateCompany(
    organizationId: string,
    companyId: string,
    dto: UpdateCompanyDto,
  ) {
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        organizationId,
        isArchived: false,
      },
    });

    if (!existingCompany) {
      throw new NotFoundException('Company not found');
    }

    if (dto.name && dto.name.trim() !== existingCompany.name) {
      const duplicateCompany = await this.prisma.company.findFirst({
        where: {
          organizationId,
          name: dto.name.trim(),
          id: {
            not: companyId,
          },
        },
      });

      if (duplicateCompany) {
        throw new ConflictException(
          'A company with this name already exists in this organization',
        );
      }
    }

    return this.prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        name: dto.name?.trim(),
        industry: dto.industry,
        website: dto.website,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        notes: dto.notes,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        industry: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        country: true,
        notes: true,
        isArchived: true,
        updatedAt: true,
      },
    });
  }

  async archiveCompany(
    organizationId: string,
    companyId: string,
  ) {
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        organizationId,
        isArchived: false,
      },
    });

    if (!existingCompany) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        isArchived: true,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        isArchived: true,
        updatedAt: true,
      },
    });
  }
}