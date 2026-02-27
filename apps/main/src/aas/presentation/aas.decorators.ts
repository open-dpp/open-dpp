import { applyDecorators, Body, Delete, Get, HttpCode, Param, Patch, Post, Query, Req } from "@nestjs/common";

import {
  AssetAdministrationShellModificationSchema,
  SubmodelElementModificationSchema,
  SubmodelElementSchema,
  SubmodelModificationSchema,
  SubmodelRequestDtoSchema,
  ValueSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { z } from "zod";
import { IdShortPath } from "../domain/submodel-base/submodel-base";

const DeleteHttpCode = HttpCode(204);

export const ApiGetShellsPath = "/:id/shells";
export function ApiGetShells() {
  return applyDecorators(
    Get(ApiGetShellsPath),
  );
}

export const ApiPatchShellPath = "/:id/shells/:aasId";
export function ApiPatchShell() {
  return applyDecorators(
    Patch(ApiPatchShellPath),
  );
}

export const ApiSubmodelsPath = "/:id/submodels";
export function ApiGetSubmodels() {
  return applyDecorators(
    Get(ApiSubmodelsPath),
  );
}

export function ApiPostSubmodel() {
  return applyDecorators(
    Post(ApiSubmodelsPath),
  );
}

export const ApiGetSubmodelByIdPath = "/:id/submodels/:submodelId";
export function ApiGetSubmodelById() {
  return applyDecorators(
    Get(ApiGetSubmodelByIdPath),
  );
}

export function ApiDeleteSubmodelById() {
  return applyDecorators(
    Delete(ApiGetSubmodelByIdPath),
    HttpCode(204), // Explicitly state the HTTP status code
  );
}

export function ApiPatchSubmodel() {
  return applyDecorators(
    Patch(ApiGetSubmodelByIdPath),
  );
}

export const ApiGetSubmodelValuePath = "/:id/submodels/:submodelId/$value";
export function ApiGetSubmodelValue() {
  return applyDecorators(
    Get(ApiGetSubmodelValuePath),
  );
}

export const ApiSubmodelElementsPath = "/:id/submodels/:submodelId/submodel-elements";
export function ApiGetSubmodelElements() {
  return applyDecorators(
    Get(ApiSubmodelElementsPath),
  );
}

export function ApiPostSubmodelElement() {
  return applyDecorators(
    Post(ApiSubmodelElementsPath),
  );
}

export const ApiGetSubmodelElementByIdPath = "/:id/submodels/:submodelId/submodel-elements/:idShortPath";
export function ApiGetSubmodelElementById() {
  return applyDecorators(
    Get(ApiGetSubmodelElementByIdPath),
  );
}

export function ApiDeleteSubmodelElementById() {
  return applyDecorators(
    Delete(ApiGetSubmodelElementByIdPath),
    DeleteHttpCode,
  );
}

export function ApiPatchSubmodelElement() {
  return applyDecorators(
    Patch(ApiGetSubmodelElementByIdPath),
  );
}

export function ApiPostSubmodelElementAtIdShortPath() {
  return applyDecorators(
    Post(ApiGetSubmodelElementByIdPath),
  );
}
export const ApiPostColumnPath = `${ApiGetSubmodelElementByIdPath}/columns`;

export function ApiPostColumn() {
  return applyDecorators(
    Post(ApiPostColumnPath),
  );
}

export const ApiGetColumnByIdShortPath = `${ApiPostColumnPath}/:idShortOfColumn`;

export function ApiDeleteColumn() {
  return applyDecorators(
    Delete(ApiGetColumnByIdShortPath),
  );
}

export function ApiPatchColumn() {
  return applyDecorators(
    Patch(ApiGetColumnByIdShortPath),
  );
}

export const ApiPostRowPath = `${ApiGetSubmodelElementByIdPath}/rows`;

export function ApiPostRow() {
  return applyDecorators(
    Post(ApiPostRowPath),
  );
}

export const ApiDeleteRowPath = `${ApiPostRowPath}/:idShortOfRow`;
export function ApiDeleteRow() {
  return applyDecorators(
    Delete(ApiDeleteRowPath),
  );
}

export const ApiGetSubmodelElementValuePath = "/:id/submodels/:submodelId/submodel-elements/:idShortPath/$value";
export function ApiGetSubmodelElementValue() {
  return applyDecorators(
    Get(ApiGetSubmodelElementValuePath),
  );
}

export function ApiPatchSubmodelElementValue() {
  return applyDecorators(
    Patch(ApiGetSubmodelElementValuePath),
  );
}

const IdBaseSchema = z.string().transform((v) => {
  let parsed = z.uuid().safeParse(v);
  if (parsed.success) {
    return parsed.data;
  }
  parsed = z.base64().safeParse(v);
  if (parsed.success) { // In case of base64 encoded IRI, URL
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
export const SubmodelIdParam = () => Param("submodelId", new ZodValidationPipe(SubmodelIdParamSchema));

export const AssetAdministrationShellIdParamSchema = IdBaseSchema.meta({
  description: "The asset administration shell id",
  example: "032a7e62-29e2-4530-8f4b-765e32514a56",
  param: { in: "path", name: "aasId" },
});

export const AssetAdministrationShellIdParam = () => Param("aasId", new ZodValidationPipe(AssetAdministrationShellIdParamSchema));

export const IdShortPathParamSchema = z.string().regex(
  /^[^./]+(?:\.[^./]+)*$/,
  "Path must be segments optionally separated by dots",
).transform(v => IdShortPath.create({ path: v })).meta({
  description: "IdShort path to the submodel element (dot-separated)",
  example: "path1.path2.path3",
  param: { in: "path", name: "idShortPath" },
});
export const IdShortPathParam = () => Param("idShortPath", new ZodValidationPipe(IdShortPathParamSchema));

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

export const LimitQueryParamSchema = z.coerce.number().optional().meta({
  description: "The maximum number of elements in the response array",
  example: 10,
  param: { in: "query", name: "limit" },
});

export const LimitQueryParam = () => Query("limit", new ZodValidationPipe(LimitQueryParamSchema));

export const CursorQueryParamSchema = z.string().optional().meta({
  description: "A server-generated identifier retrieved from pagingMetadata that specifies from which position the result listing should continue",
  example: "958b741c-c2ef-4366-a134-fafd30210ed4 ",
  param: { in: "query", name: "cursor" },
});

export const PositionQueryParamSchema = z.coerce.number().optional().meta({
  description: "The position of the element in the result listing. The first element has position 0.",
  example: 1,
  param: { in: "query", name: "position" },
});

export const POPULATES = {
  assetAdministrationShells: "environment.assetAdministrationShells",
} as const;

export const ALLOWED_POPULATES = [
  POPULATES.assetAdministrationShells,
] as const;

export const PopulateSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform(val => (val ? (Array.isArray(val) ? val : [val]) : []))
  .refine(
    paths => paths.every(p => ALLOWED_POPULATES.includes(p as any)),
    { message: `Invalid populate path. Allowed paths: ${ALLOWED_POPULATES.join(", ")}.` },
  );

export const PopulateQueryParamSchema = PopulateSchema.meta({
  description: "Populates specified environment property",
  example: "environment.assetAdministrationShells",
  param: { in: "query", name: "cursor" },
});

export const PopulateQueryParam = () => Query("populate", new ZodValidationPipe(PopulateQueryParamSchema));

export const PositionQueryParam = () => Query("position", new ZodValidationPipe(PositionQueryParamSchema));

export const CursorQueryParam = () => Query("cursor", new ZodValidationPipe(CursorQueryParamSchema));

export const AssetAdministrationShellModificationRequestBody = () => Body(new ZodValidationPipe(AssetAdministrationShellModificationSchema));

export const SubmodelRequestBody = () => Body(new ZodValidationPipe(SubmodelRequestDtoSchema));
export const SubmodelModificationRequestBody = () => Body(new ZodValidationPipe(SubmodelModificationSchema));

export const SubmodelElementRequestBody = () => Body(new ZodValidationPipe(SubmodelElementSchema));
export const SubmodelElementModificationRequestBody = () => Body(new ZodValidationPipe(SubmodelElementModificationSchema));
export const SubmodelElementValueModificationRequestBody = () => Body(new ZodValidationPipe(ValueSchema));
