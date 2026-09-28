import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    organizationName: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    const slug = this.createSlug(organizationName);

    const existingOrganization = await this.prisma.organization.findUnique({
      where: {
        slug,
      },
    });

    if (existingOrganization) {
      throw new ConflictException(
        'An organization with this name already exists',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const organization = await this.prisma.organization.create({
      data: {
        name: organizationName,
        slug,
        users: {
          create: {
            email: normalizedEmail,
            password: passwordHash,
            firstName,
            lastName,
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = organization.users[0];

    const token = await this.jwtService.signAsync({
      sub: user.id,
      organizationId: organization.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: organization.id,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
    };
  }

  private createSlug(name: string): string {
    return `${name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}-${Date.now()}`;
  }
}