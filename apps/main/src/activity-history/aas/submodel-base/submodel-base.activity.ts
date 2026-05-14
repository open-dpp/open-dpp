import { SharedActivityCreateProps } from "../shared.activity";
import { SubmodelBaseCreateActivityPayload } from "./submodel-base-create.payload";

export interface SubmodelCreateActivityCreateProps extends SharedActivityCreateProps {
  payload: SubmodelBaseCreateActivityPayload;
}
