import { LeadSource, LeadStatus } from '../../generated/prisma/enums.js';

export class UpdateLeadDto {
  companyId?: string;
  contactId?: string;

  firstName?: string;
  lastName?: string;

  email?: string;
  phone?: string;
  jobTitle?: string;

  source?: LeadSource;
  status?: LeadStatus;

  notes?: string;
  isArchived?: boolean;
}