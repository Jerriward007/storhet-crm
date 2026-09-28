import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductCategory } from '../generated/prisma/client.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createProductDto: CreateProductDto,
  ) {
    if (createProductDto.sku) {
      await this.validateSku(
        organizationId,
        createProductDto.sku,
      );
    }

    try {
      return await this.prisma.product.create({
        data: {
          organizationId,
          name: createProductDto.name,
          sku: createProductDto.sku,
          description: createProductDto.description,
          category:
            createProductDto.category ?? ProductCategory.OTHER,
          unitPrice: createProductDto.unitPrice,
          costPrice: createProductDto.costPrice,
          currency: createProductDto.currency ?? 'NGN',
          isActive: createProductDto.isActive ?? true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'A product with this name or SKU already exists',
        );
      }

      throw error;
    }
  }

  async findAll(
    organizationId: string,
    filters?: {
      category?: ProductCategory;
      isActive?: boolean;
      search?: string;
    },
  ) {
    const where: any = {
      organizationId,
    };

    if (filters?.category !== undefined) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    organizationId: string,
    id: string,
    updateProductDto: UpdateProductDto,
  ) {
    await this.findOne(organizationId, id);

    if (updateProductDto.sku !== undefined) {
      await this.validateSku(
        organizationId,
        updateProductDto.sku,
        id,
      );
    }

    try {
      return await this.prisma.product.update({
        where: {
          id,
        },
        data: {
          name: updateProductDto.name,
          sku: updateProductDto.sku,
          description: updateProductDto.description,
          category: updateProductDto.category,
          unitPrice: updateProductDto.unitPrice,
          costPrice: updateProductDto.costPrice,
          currency: updateProductDto.currency,
          isActive: updateProductDto.isActive,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'A product with this name or SKU already exists',
        );
      }

      throw error;
    }
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    await this.prisma.product.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Product deleted successfully',
    };
  }

  private async validateSku(
    organizationId: string,
    sku: string,
    excludeId?: string,
  ) {
    const where: any = {
      organizationId,
      sku,
    };

    if (excludeId) {
      where.NOT = {
        id: excludeId,
      };
    }

    const existingProduct =
      await this.prisma.product.findFirst({
        where,
        select: {
          id: true,
        },
      });

    if (existingProduct) {
      throw new BadRequestException(
        'A product with this SKU already exists',
      );
    }
  }
}