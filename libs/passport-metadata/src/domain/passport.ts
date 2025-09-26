export type PassportProps = {
  uuid: string;
  ownedByOrganizationId: string;
  templateId: string;
  modelId: string;
  passportId: string;
};

export class Passport {
  private constructor(
    public readonly uuid: string,
    public readonly passportId: string,
    public readonly ownedByOrganizationId: string,
    public readonly templateId: string,
    public readonly modelId: string,
  ) {}

  static create(data: PassportProps): Passport {
    return new Passport(
      data.uuid,
      data.passportId,
      data.ownedByOrganizationId,
      data.templateId,
      data.modelId,
    );
  }
}
