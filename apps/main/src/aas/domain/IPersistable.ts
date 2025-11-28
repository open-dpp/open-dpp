export interface IPersistable {
  id: string;
  toPlain: () => Record<string, any>;
}
