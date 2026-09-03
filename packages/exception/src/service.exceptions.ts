export class NotFoundInDatabaseException extends Error {
  constructor(entityName: string, id?: string) {
    super(`${entityName}${id ? ` with id ${id} ` : " "}could not be found.`);
  }
}
