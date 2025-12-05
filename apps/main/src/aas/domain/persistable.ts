import { IConvertableToPlain } from "./convertable-to-plain";

export interface IPersistable extends IConvertableToPlain {
  id: string;
}
