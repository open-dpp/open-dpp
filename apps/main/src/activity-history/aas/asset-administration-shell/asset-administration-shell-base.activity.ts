import { AssetAdministrationShellModificationActivityPayload } from "./asset-administration-shell-modification.payload";
import { SharedActivityCreateProps } from "../shared.activity";

export interface AssetAdministrationShellModificationActivityCreateProps extends SharedActivityCreateProps {
  payload: AssetAdministrationShellModificationActivityPayload;
}
