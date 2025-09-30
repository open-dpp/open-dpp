import { Passport } from '../../../apps/main/src/ai/passports/domain/passport';

export class PassportServiceTesting {
  private passports = new Map<string, Passport>();
  addPassport(uuid: string, passport: Passport) {
    this.passports.set(uuid, passport);
  }
  async findOneOrFail(uuid: string): Promise<Passport | undefined> {
    return this.passports.get(uuid);
  }
}
