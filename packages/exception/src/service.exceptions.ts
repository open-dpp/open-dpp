export class NotFoundInDatabaseException extends Error {
  constructor(entityName: string) {
    super(`${entityName} could not be found.`);
  }
}
