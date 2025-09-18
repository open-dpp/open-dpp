import { randomUUID } from 'crypto';
import { Factory } from 'fishery';
import { PassportProps } from '../domain/passport';

export const passportFactory = Factory.define<PassportProps>(() => {
  return {
    ownedByOrganizationId: randomUUID(),
    uuid: randomUUID(),
  };
});
