export class DataValue {
  public readonly value: unknown;
  public readonly dataSectionId: string;
  public readonly dataFieldId: string;
  public readonly row: number;

  private constructor(
    value: unknown,
    dataSectionId: string,
    dataFieldId: string,
    row: number,
  ) {
    this.value = value;
    this.dataSectionId = dataSectionId;
    this.dataFieldId = dataFieldId;
    this.row = row;
  }

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
