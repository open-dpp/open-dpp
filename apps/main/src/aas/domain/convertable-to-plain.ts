export interface IConvertableToPlain {
  toPlain: (options?: any) => Record<string, any>;
}
