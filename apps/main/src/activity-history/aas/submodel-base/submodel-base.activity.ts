import { SubmodelBaseModificationActivityPayload } from "./submodel-base-modification.payload";
import { SharedActivityCreateProps } from "../shared.activity";
import { SubmodelBaseCreateActivityPayload } from "./submodel-base-create.payload";

export interface SubmodelModificationActivityCreateProps extends SharedActivityCreateProps {
  payload: SubmodelBaseModificationActivityPayload;
}

export interface SubmodelCreateActivityCreateProps extends SharedActivityCreateProps {
  payload: SubmodelBaseCreateActivityPayload;
}
