export interface IConvertableToPlain {
  toPlain: () => Record<string, any>;
}
