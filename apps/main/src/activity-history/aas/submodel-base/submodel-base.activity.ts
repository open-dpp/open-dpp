import { SubmodelBaseModificationActivityPayload } from "./submodel-base-modification.payload";
import { SharedActivityCreateProps } from "../shared.activity";

export interface SubmodelActivityCreateProps extends SharedActivityCreateProps {
  payload: SubmodelBaseModificationActivityPayload;
}
