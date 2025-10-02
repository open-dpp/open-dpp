import { passportFactory } from '../fixtures/passport.factory'
import { Passport } from './passport'

describe('passportTemplate', () => {
  it('is created', () => {
    const props = passportFactory.build()

    const passport = Passport.create(props)
    expect(passport).toBeInstanceOf(Passport)
    expect(passport.uuid).toEqual(props.uuid)
    expect(passport.ownedByOrganizationId).toEqual(props.ownedByOrganizationId)
  })
})
