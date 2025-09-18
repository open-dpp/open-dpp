export type PassportProps = {
  uuid: string;
  ownedByOrganizationId: string;
};

export class Passport {
  private constructor(
    public readonly uuid: string,
    public readonly ownedByOrganizationId: string,
  ) {}

  static create(data: PassportProps): Passport {
    return new Passport(data.uuid, data.ownedByOrganizationId);
  }
}
