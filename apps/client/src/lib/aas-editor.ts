import type { AasNamespace } from "@open-dpp/api-client";
import type {
  AasEditorPath,
  EditorType,
  OpenDrawerCallback,
} from "../composables/aas-drawer.ts";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import { z } from "zod";

export const AasEditMode = {
  Passport: "passport",
  Template: "template",
} as const;

export const AasEditModeEnum = z.enum(AasEditMode);
export type AasEditModeType = z.infer<typeof AasEditModeEnum>;

export interface SharedEditorProps<Data, RequestDto> {
  path: AasEditorPath;
  data: Data;
  callback: (data: RequestDto) => Promise<void>;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  id: string;
  translate: (label: string, ...args: unknown[]) => string;
}
