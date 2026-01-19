export interface Mapper<DomainEntity, PersistenceModel> {
  toDomain: (record: PersistenceModel) => DomainEntity;

  toPersistence: (entity: DomainEntity) => PersistenceModel;
}
