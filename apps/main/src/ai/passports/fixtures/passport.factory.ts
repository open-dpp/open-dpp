import type { PassportProps } from '../domain/passport'
import { randomUUID } from 'node:crypto'
import { Factory } from 'fishery'

export const passportFactory = Factory.define<PassportProps>(() => {
  return {
    ownedByOrganizationId: randomUUID(),
    uuid: randomUUID(),
  }
})
