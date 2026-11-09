export class NotFoundError extends Error {}

export class ValueError extends Error {}

export class ForbiddenError extends Error {}

export class NotSupportedError extends Error {}

/** An entity was changed by someone else after it was read, so saving it would overwrite that change. */
export class ConcurrentModificationError extends Error {}
