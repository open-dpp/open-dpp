import {
  applyDecorators,
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";

import {
  AssetAdministrationShellModificationSchema,
  DeletePolicyDtoSchema,
  SubmodelElementModificationSchema,
  SubmodelElementSchema,
  SubmodelModificationSchema,
  SubmodelRequestDtoSchema,
  ValueSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { z } from "zod";

import { IdShortPath } from "../domain/common/id-short-path";

const DeleteHttpCode = HttpCode(204);

// Helper to safely join an optional prefix with the original path
function withPrefix(path: string, prefix?: string): string {
  if (!prefix) return path;
  const trim = (s: string) => s.replace(/^\/+|\/+$/g, "");
  return `/${trim(prefix)}/${trim(path)}`;
}

export const ApiGetShellsPath = "/:id/shells";
export function ApiGetShells(prefix?: string) {
  return applyDecorators(Get(withPrefix(ApiGetShellsPath, prefix)));
}

export const ApiPatchShellPath = "/:id/shells/:aasId";
export function ApiPatchShell() {
  return applyDecorators(Patch(ApiPatchShellPath));
}

export const ApiSubmodelsPath = "/:id/submodels";
export function ApiGetSubmodels(prefix?: string) {
  return applyDecorators(Get(withPrefix(ApiSubmodelsPath, prefix)));
}

export function ApiPostSubmodel(prefix?: string) {
  return applyDecorators(Post(withPrefix(ApiSubmodelsPath, prefix)));
}

export const ApiGetSubmodelByIdPath = "/:id/submodels/:submodelId";
export function ApiGetSubmodelById(prefix?: string) {
  return applyDecorators(Get(withPrefix(ApiGetSubmodelByIdPath, prefix)));
}

export const ApiDeletePolicyPath = "/:id/security/policies";
export function ApiDeletePolicy() {
  return applyDecorators(
    Delete(withPrefix(ApiDeletePolicyPath)),
    HttpCode(204), // Explicitly state the HTTP status code
  );
}

export function ApiDeleteSubmodelById(prefix?: string) {
  return applyDecorators(
    Delete(withPrefix(ApiGetSubmodelByIdPath, prefix)),
    HttpCode(204), // Explicitly state the HTTP status code
  );
}

export function ApiPatchSubmodel(prefix?: string) {
  return applyDecorators(Patch(withPrefix(ApiGetSubmodelByIdPath, prefix)));
}

export const ApiGetSubmodelValuePath = "/:id/submodels/:submodelId/$value";
export function ApiGetSubmodelValue(prefix?: string) {
  return applyDecorators(Get(withPrefix(ApiGetSubmodelValuePath, prefix)));
}

export const ApiSubmodelElementsPath = "/:id/submodels/:submodelId/submodel-elements";
export function ApiGetSubmodelElements(prefix?: string) {
  return applyDecorators(Get(withPrefix(ApiSubmodelElementsPath, prefix)));
}

export function ApiPostSubmodelElement(prefix?: string) {
  return applyDecorators(Post(withPrefix(ApiSubmodelElementsPath, prefix)));
}

export const ApiGetSubmodelElementByIdPath =
  "/:id/submodels/:submodelId/submodel-elements/:idShortPath";
export function ApiGetSubmodelElementById(prefix?: string) {
  return applyDecorators(Get(withPrefix(ApiGetSubmodelElementByIdPath, prefix)));
}

export function ApiDeleteSubmodelElementById(prefix?: string) {
  return applyDecorators(Delete(withPrefix(ApiGetSubmodelElementByIdPath, prefix)), DeleteHttpCode);
}

export function ApiPatchSubmodelElement(prefix?: string) {
  return applyDecorators(Patch(withPrefix(ApiGetSubmodelElementByIdPath, prefix)));
}

export function ApiPostSubmodelElementAtIdShortPath(prefix?: string) {
  return applyDecorators(Post(withPrefix(ApiGetSubmodelElementByIdPath, prefix)));
}
export const ApiPostColumnPath = `${ApiGetSubmodelElementByIdPath}/columns`;

export function ApiPostColumn(prefix?: string) {
  return applyDecorators(Post(withPrefix(ApiPostColumnPath, prefix)));
}

export const ApiGetColumnByIdShortPath = `${ApiPostColumnPath}/:idShortOfColumn`;

export function ApiDeleteColumn(prefix?: string) {
  return applyDecorators(Delete(withPrefix(ApiGetColumnByIdShortPath, prefix)));
}

export function ApiPatchColumn(prefix?: string) {
  return applyDecorators(Patch(withPrefix(ApiGetColumnByIdShortPath, prefix)));
}

export const ApiPostRowPath = `${ApiGetSubmodelElementByIdPath}/rows`;

export function ApiPostRow(prefix?: string) {
  return applyDecorators(Post(withPrefix(ApiPostRowPath, prefix)));
}

export const ApiDeleteRowPath = `${ApiPostRowPath}/:idShortOfRow`;
export function ApiDeleteRow(prefix?: string) {
  return applyDecorators(Delete(withPrefix(ApiDeleteRowPath, prefix)));
}

export const ApiGetSubmodelElementValuePath =
  "/:id/submodels/:submodelId/submodel-elements/:idShortPath/$value";
export function ApiGetSubmodelElementValue(prefix?: string) {
  return applyDecorators(Get(withPrefix(ApiGetSubmodelElementValuePath, prefix)));
}

export function ApiPatchSubmodelElementValue(prefix?: string) {
  return applyDecorators(Patch(withPrefix(ApiGetSubmodelElementValuePath, prefix)));
}

const IdBaseSchema = z.string().transform((v) => {
  let parsed = z.uuid().safeParse(v);
  if (parsed.success) {
    return parsed.data;
  }
  parsed = z.base64().safeParse(v);
  if (parsed.success) {
    // In case of base64 encoded IRI, URL
    return atob(parsed.data);
  }
  return v;
});

export const IdParamSchema = IdBaseSchema.meta({
  description: "The id",
  example: "958b741c-c2ef-4366-a134-fafd30210ed4",
  param: { in: "path", name: "id" },
});

export const IdParam = () => Param("id", new ZodValidationPipe(IdParamSchema));

export const SubmodelIdParamSchema = IdBaseSchema.meta({
  description: "The submodel id",
  example: "032a7e62-29e2-4530-8f4b-765e32514a56",
  param: { in: "path", name: "submodelId" },
});
export const SubmodelIdParam = () =>
  Param("submodelId", new ZodValidationPipe(SubmodelIdParamSchema));

export const AssetAdministrationShellIdParamSchema = IdBaseSchema.meta({
  description: "The asset administration shell id",
  example: "032a7e62-29e2-4530-8f4b-765e32514a56",
  param: { in: "path", name: "aasId" },
});

export const AssetAdministrationShellIdParam = () =>
  Param("aasId", new ZodValidationPipe(AssetAdministrationShellIdParamSchema));

export const IdShortPathParamSchema = z
  .string()
  .regex(/^[^./]+(?:\.[^./]+)*$/, "Path must be segments optionally separated by dots")
  .transform((v) => IdShortPath.create({ path: v }))
  .meta({
    description: "IdShort path to the submodel element (dot-separated)",
    example: "path1.path2.path3",
    param: { in: "path", name: "idShortPath" },
  });
export const IdShortPathParam = () =>
  Param("idShortPath", new ZodValidationPipe(IdShortPathParamSchema));

export const ColumnParamSchema = z.string().meta({
  description: "IdShort of the column.",
  example: "Col1",
  param: { in: "path", name: "idShortOfColumn" },
});

export const ColumnParam = () => Param("idShortOfColumn", new ZodValidationPipe(ColumnParamSchema));

export const RowParamSchema = z.string().meta({
  description: "IdShort of the row.",
  example: "Row1",
  param: { in: "path", name: "idShortOfRow" },
});

export const RowParam = () => Param("idShortOfRow", new ZodValidationPipe(RowParamSchema));

export const RequestParam = () => Req();

export const LimitQueryParamSchema = z.coerce
  .number()
  .optional()
  .meta({
    description: "The maximum number of elements in the response array",
    example: 10,
    param: { in: "query", name: "limit" },
  });

export const LimitQueryParam = () => Query("limit", new ZodValidationPipe(LimitQueryParamSchema));

export const CursorQueryParamSchema = z
  .string()
  .optional()
  .meta({
    description:
      "A server-generated identifier retrieved from pagingMetadata that specifies from which position the result listing should continue",
    example: "958b741c-c2ef-4366-a134-fafd30210ed4 ",
    param: { in: "query", name: "cursor" },
  });

export const PositionQueryParamSchema = z.coerce
  .number()
  .optional()
  .meta({
    description:
      "The position of the element in the result listing. The first element has position 0.",
    example: 1,
    param: { in: "query", name: "position" },
  });

export const PositionQueryParam = () =>
  Query("position", new ZodValidationPipe(PositionQueryParamSchema));

export const CursorQueryParam = () =>
  Query("cursor", new ZodValidationPipe(CursorQueryParamSchema));

export const AssetAdministrationShellModificationRequestBody = () =>
  Body(new ZodValidationPipe(AssetAdministrationShellModificationSchema));

export const SubmodelRequestBody = () => Body(new ZodValidationPipe(SubmodelRequestDtoSchema));
export const SubmodelModificationRequestBody = () =>
  Body(new ZodValidationPipe(SubmodelModificationSchema));

export const SubmodelElementRequestBody = () => Body(new ZodValidationPipe(SubmodelElementSchema));
export const SubmodelElementModificationRequestBody = () =>
  Body(new ZodValidationPipe(SubmodelElementModificationSchema));
export const SubmodelElementValueModificationRequestBody = () =>
  Body(new ZodValidationPipe(ValueSchema));

export const DeletePolicyRequestBody = () => Body(new ZodValidationPipe(DeletePolicyDtoSchema));
