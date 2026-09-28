import { LeadSource, LeadStatus } from '../../generated/prisma/enums.js';

export class CreateLeadDto {
  companyId?: string;
  contactId?: string;

  firstName: string;
  lastName: string;

  email?: string;
  phone?: string;
  jobTitle?: string;

  source?: LeadSource;
  status?: LeadStatus;

  notes?: string;
}