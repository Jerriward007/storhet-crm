import { ActivityStatus, ActivityType } from '../../generated/prisma/enums.js';

export class CreateActivityDto {
  type?: ActivityType;

  status?: ActivityStatus;

  subject: string;

  description?: string;

  dueDate?: string;

  companyId?: string;

  contactId?: string;

  leadId?: string;

  opportunityId?: string;
}