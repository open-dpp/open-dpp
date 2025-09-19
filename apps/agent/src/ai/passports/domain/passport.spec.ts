import { Passport } from './passport';
import { passportFactory } from '../fixtures/passport.factory';

describe('PassportTemplate', () => {
  it('is created', () => {
    const props = passportFactory.build();

    const passport = Passport.create(props);
    expect(passport).toBeInstanceOf(Passport);
    expect(passport.uuid).toEqual(props.uuid);
    expect(passport.ownedByOrganizationId).toEqual(props.ownedByOrganizationId);
  });
});
