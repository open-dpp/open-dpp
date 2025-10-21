export class AdministrativeInformation {
  private constructor(public readonly version: string, public readonly revision: string) {
  }

  static create(data: { version: string; revision: string }): AdministrativeInformation {
    return new AdministrativeInformation(data.version, data.revision);
  }
}
