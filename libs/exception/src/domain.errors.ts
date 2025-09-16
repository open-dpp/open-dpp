export class NotFoundError extends Error {
  constructor(model: string, id?: string) {
    super(`${model} with id ${id} could not be found.`);
  }
}

export class ValueError extends Error {}

export class NotSupportedError extends Error {}
