import { IDigitalProductPassportIdentifiable } from "../domain/digital-product-passport-identifiable";

export interface IDigitalProductPassportIdentifiableRepository {
  findOneOrFail: (id: string) => Promise<IDigitalProductPassportIdentifiable>;
  findOne: (id: string) => Promise<IDigitalProductPassportIdentifiable | undefined>;
}
