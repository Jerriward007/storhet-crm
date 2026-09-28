import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { OpportunitiesModule } from './opportunities/opportunities.module.js';
import { PipelineModule } from './pipeline/pipeline.module.js';
import { ActivitiesModule } from './activities/activities.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { ProductsModule } from './products/products.module.js';
import { QuotationsModule } from './quotations/quotations.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    CompaniesModule,
    ContactsModule,
    LeadsModule,
    OpportunitiesModule,
    PipelineModule,
    ActivitiesModule,
    TasksModule,
    ProductsModule,
    QuotationsModule,
    ReportsModule,
    DashboardModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}