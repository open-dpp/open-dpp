export interface PassportProps {
  uuid: string
  ownedByOrganizationId: string
}

export class Passport {
  public readonly uuid: string
  public readonly ownedByOrganizationId: string

  private constructor(
    uuid: string,
    ownedByOrganizationId: string,
  ) {
    this.uuid = uuid
    this.ownedByOrganizationId = ownedByOrganizationId
  }

  static create(data: PassportProps): Passport {
    return new Passport(data.uuid, data.ownedByOrganizationId)
  }
}
