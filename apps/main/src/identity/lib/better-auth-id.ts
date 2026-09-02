import { ObjectId } from "mongodb";

/**
 * Better-auth stores string ids while its MongoDB adapter may store id and
 * reference fields as ObjectId; this filter matches both forms. Use it on
 * Mixed-typed schema fields or raw-driver queries — Mongoose casting on an
 * ObjectId-typed field would collapse both branches to ObjectId again.
 * The `$in`/`$eq` wrapper also guards against NoSQL operator injection.
 */
export function idFilter(value: string): { $in: (string | ObjectId)[] } | { $eq: string } {
  return ObjectId.isValid(value) ? { $in: [value, new ObjectId(value)] } : { $eq: value };
}
