export class Resource {
  private constructor(
    public readonly path: string,
    public readonly contentType: string | null,
  ) {
  }

  static create(data: {
    path: string;
    contentType?: string;
  }) {
    return new Resource(
      data.path,
      data.contentType ?? null,
    );
  }
}
