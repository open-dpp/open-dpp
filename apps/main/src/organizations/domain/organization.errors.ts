export class DuplicateOrganizationSlugError extends Error {
  constructor(public readonly slug: string) {
    super(`Organization with slug "${slug}" already exists`);
  }
}
