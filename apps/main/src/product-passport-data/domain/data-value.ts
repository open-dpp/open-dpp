export class DataValue {
  private constructor(
    public readonly value: unknown,
    public readonly dataSectionId: string,
    public readonly dataFieldId: string,
    public readonly row: number,
  ) {}

  static create(data: {
    value: unknown;
    dataSectionId: string;
    dataFieldId: string;
    row: number;
  }) {
    return new DataValue(
      data.value,
      data.dataSectionId,
      data.dataFieldId,
      data.row,
    );
  }
}
