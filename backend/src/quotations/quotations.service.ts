import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuotationDto } from './dto/create-quotation.dto.js';
import { UpdateQuotationDto } from './dto/update-quotation.dto.js';
import {
  QuotationStatus,
} from '../generated/prisma/client.js';

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    ownerId: string,
    dto: CreateQuotationDto,
  ) {
    await this.validateReferences(
      organizationId,
      dto.companyId,
      dto.contactId,
    );

    const quotationNumber = await this.generateQuotationNumber();

    const tax = Number(dto.tax ?? 0);
    const discount = Number(dto.discount ?? 0);

    const items = dto.items.map((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const itemDiscount = Number(item.discount ?? 0);
      const itemTax = Number(item.tax ?? 0);

      const subtotal = quantity * unitPrice;
      const total =
        subtotal - itemDiscount + itemTax;

      return {
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount ?? '0',
        tax: item.tax ?? '0',
        total: total.toFixed(2),
      };
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );

    const total =
      subtotal - discount + tax;

    try {
      return await this.prisma.quotation.create({
        data: {
          organizationId,
          ownerId,
          quotationNumber,
          companyId: dto.companyId,
          contactId: dto.contactId,
          title: dto.title,
          description: dto.description,
          status: dto.status ?? QuotationStatus.DRAFT,
          currency: dto.currency ?? 'NGN',
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          discount: discount.toFixed(2),
          total: total.toFixed(2),
          validUntil: dto.validUntil
            ? new Date(dto.validUntil)
            : undefined,
          notes: dto.notes,
          items: {
            create: items,
          },
        },
        include: {
          items: true,
          company: true,
          contact: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'Quotation number already exists',
        );
      }

      throw error;
    }
  }

  async findAll(
    organizationId: string,
    filters?: {
      status?: QuotationStatus;
      search?: string;
    },
  ) {
    const where: any = {
      organizationId,
    };

    if (filters?.status !== undefined) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        {
          quotationNumber: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          title: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.quotation.findMany({
      where,
      include: {
        company: true,
        contact: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    organizationId: string,
    id: string,
  ) {
    const quotation =
      await this.prisma.quotation.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          company: true,
          contact: true,
          items: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

    if (!quotation) {
      throw new NotFoundException(
        'Quotation not found',
      );
    }

    return quotation;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateQuotationDto,
  ) {
    const existing =
      await this.findOne(organizationId, id);

    if (dto.companyId || dto.contactId) {
      await this.validateReferences(
        organizationId,
        dto.companyId ?? existing.companyId ?? undefined,
        dto.contactId ?? existing.contactId ?? undefined,
      );
    }

    const updateData: any = {
      companyId: dto.companyId,
      contactId: dto.contactId,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      currency: dto.currency,
      validUntil: dto.validUntil
        ? new Date(dto.validUntil)
        : undefined,
      notes: dto.notes,
    };

    if (dto.items) {
      const tax = Number(dto.tax ?? existing.tax);
      const discount = Number(
        dto.discount ?? existing.discount,
      );

      const items = dto.items.map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const itemDiscount = Number(item.discount ?? 0);
        const itemTax = Number(item.tax ?? 0);

        const subtotal = quantity * unitPrice;

        return {
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? '0',
          tax: item.tax ?? '0',
          total: (
            subtotal -
            itemDiscount +
            itemTax
          ).toFixed(2),
        };
      });

      const subtotal = items.reduce(
        (sum, item) => sum + Number(item.total),
        0,
      );

      updateData.tax = tax.toFixed(2);
      updateData.discount = discount.toFixed(2);
      updateData.subtotal = subtotal.toFixed(2);
      updateData.total = (
        subtotal -
        discount +
        tax
      ).toFixed(2);

      updateData.items = {
        deleteMany: {},
        create: items,
      };
    } else {
      if (dto.tax !== undefined) {
        updateData.tax = dto.tax;
      }

      if (dto.discount !== undefined) {
        updateData.discount = dto.discount;
      }
    }

    return this.prisma.quotation.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        items: true,
        company: true,
        contact: true,
      },
    });
  }

  async remove(
    organizationId: string,
    id: string,
  ) {
    await this.findOne(organizationId, id);

    await this.prisma.quotation.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Quotation deleted successfully',
    };
  }

  private async generateQuotationNumber() {
    const year = new Date().getFullYear();

    const count =
      await this.prisma.quotation.count();

    return `QT-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async validateReferences(
    organizationId: string,
    companyId?: string,
    contactId?: string,
  ) {
    if (companyId) {
      const company =
        await this.prisma.company.findFirst({
          where: {
            id: companyId,
            organizationId,
          },
        });

      if (!company) {
        throw new BadRequestException(
          'Company not found',
        );
      }
    }

    if (contactId) {
      const contact =
        await this.prisma.contact.findFirst({
          where: {
            id: contactId,
            organizationId,
          },
        });

      if (!contact) {
        throw new BadRequestException(
          'Contact not found',
        );
      }
    }
  }
}