import { OpportunityStage } from '../../generated/prisma/enums.js';

export class CreateOpportunityDto {
  companyId?: string;
  contactId?: string;
  ownerId: string;

  name: string;
  description?: string;

  amount?: number;
  currency?: string;

  stage?: OpportunityStage;
  probability?: number;

  expectedCloseDate?: string;
  notes?: string;
}