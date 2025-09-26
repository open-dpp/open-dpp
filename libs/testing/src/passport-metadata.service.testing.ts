import { Passport } from '@app/passport-metadata/domain/passport';

export class PassportMetadataServiceTesting {
  private passports = new Map<string, Passport>();
  addPassport(uuid: string, passport: Passport) {
    this.passports.set(uuid, passport);
  }
  async findOneOrFail(uuid: string): Promise<Passport | undefined> {
    return this.passports.get(uuid);
  }
}
