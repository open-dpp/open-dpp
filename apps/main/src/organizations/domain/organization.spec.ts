import { randomUUID } from 'node:crypto'
import { expect } from '@jest/globals'
import { User } from '../../users/domain/user'
import { Organization } from './organization'

describe('organization', () => {
  it('creates a organization and add members', () => {
    const user = new User(randomUUID(), 'test@test.test')
    const organization = Organization.create({ name: 'My organization', user })
    const user2 = new User(randomUUID(), 'test2@test.test')
    const user3 = new User(randomUUID(), 'test3@test.test')
    organization.join(user)
    organization.join(user2)
    organization.join(user3)
    organization.join(user3)
    expect(organization.createdByUserId).toEqual(user.id)
    expect(organization.ownedByUserId).toEqual(user.id)
    expect(organization.members).toEqual([user, user2, user3])
    expect(organization.isMember(user)).toBeTruthy()
    expect(
      organization.isMember(new User(randomUUID(), 'test3@test.test')),
    ).toBeFalsy()
  })
})
