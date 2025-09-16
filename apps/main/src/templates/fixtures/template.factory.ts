import { Factory } from 'fishery';
import { TemplateCreateProps } from '../domain/template';
import { randomUUID } from 'crypto';
import { Sector } from '@open-dpp/api-client';

export const templateCreatePropsFactory = Factory.define<TemplateCreateProps>(
  () => ({
    name: 'Laptop',
    description: 'My Laptop',
    sectors: [Sector.ELECTRONICS],
    organizationId: randomUUID(),
    userId: randomUUID(),
  }),
);
