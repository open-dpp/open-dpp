export class LevelType {
  private constructor(
    public readonly min: boolean,
    public readonly nom: boolean,
    public readonly typ: boolean,
    public readonly max: boolean,
  ) {
  }

  static create(data: {
    min: boolean;
    nom: boolean;
    typ: boolean;
    max: boolean;
  }) {
    return new LevelType(
      data.min,
      data.nom,
      data.typ,
      data.max,
    );
  }
}
