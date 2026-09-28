import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { UpdateContactDto } from './dto/update-contact.dto.js';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async createContact(
    organizationId: string,
    dto: CreateContactDto,
  ) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: dto.companyId,
        organizationId,
        isArchived: false,
      },
    });

    if (!company) {
      throw new NotFoundException(
        'Company not found in this organization',
      );
    }

    const email = dto.email?.toLowerCase().trim();

    if (email) {
      const existingContact = await this.prisma.contact.findFirst({
        where: {
          organizationId,
          email,
          isArchived: false,
        },
      });

      if (existingContact) {
        throw new ConflictException(
          'A contact with this email already exists in this organization',
        );
      }
    }

    return this.prisma.contact.create({
      data: {
        organizationId,
        companyId: dto.companyId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        notes: dto.notes,
      },
      select: {
        id: true,
        organizationId: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobTitle: true,
        notes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAllContacts(
    organizationId: string,
    companyId?: string,
  ) {
    return this.prisma.contact.findMany({
      where: {
        organizationId,
        isArchived: false,
        ...(companyId ? { companyId } : {}),
      },
      select: {
        id: true,
        organizationId: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobTitle: true,
        notes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findContactById(
    organizationId: string,
    contactId: string,
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
        isArchived: false,
      },
      select: {
        id: true,
        organizationId: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobTitle: true,
        notes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async updateContact(
    organizationId: string,
    contactId: string,
    dto: UpdateContactDto,
  ) {
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
        isArchived: false,
      },
    });

    if (!existingContact) {
      throw new NotFoundException('Contact not found');
    }

    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: dto.companyId,
          organizationId,
          isArchived: false,
        },
      });

      if (!company) {
        throw new NotFoundException(
          'Company not found in this organization',
        );
      }
    }

    const email = dto.email?.toLowerCase().trim();

    if (email && email !== existingContact.email) {
      const duplicateContact = await this.prisma.contact.findFirst({
        where: {
          organizationId,
          email,
          isArchived: false,
          id: {
            not: contactId,
          },
        },
      });

      if (duplicateContact) {
        throw new ConflictException(
          'A contact with this email already exists in this organization',
        );
      }
    }

    return this.prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        companyId: dto.companyId,
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        email,
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        notes: dto.notes,
      },
      select: {
        id: true,
        organizationId: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobTitle: true,
        notes: true,
        isArchived: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async archiveContact(
    organizationId: string,
    contactId: string,
  ) {
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
        isArchived: false,
      },
    });

    if (!existingContact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        isArchived: true,
      },
      select: {
        id: true,
        organizationId: true,
        companyId: true,
        firstName: true,
        lastName: true,
        isArchived: true,
        updatedAt: true,
      },
    });
  }
}