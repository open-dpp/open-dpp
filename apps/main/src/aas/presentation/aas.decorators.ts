import { applyDecorators, Body, Get, Param, Post, Query, Req } from "@nestjs/common";

import { ZodValidationPipe } from "@open-dpp/exception";
import { z } from "zod";
import { SubmodelElementSchema } from "../domain/parsing/submodel-base/submodel-element-schema";
import { IdShortPath } from "../domain/submodel-base/submodel";
import { SubmodelRequestDtoSchema } from "./dto/submodel.dto";

export const ApiGetShellsPath = "/:id/shells";
export function ApiGetShells() {
  return applyDecorators(
    Get(ApiGetShellsPath),
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

export const ApiGetSubmodelElementValuePath = "/:id/submodels/:submodelId/submodel-elements/:idShortPath/$value";
export function ApiGetSubmodelElementValue() {
  return applyDecorators(
    Get(ApiGetSubmodelElementValuePath),
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

export const IdShortPathParamSchema = z.string().regex(
  /^[^./]+(?:\.[^./]+)*$/,
  "Path must be segments optionally separated by dots",
).transform(v => IdShortPath.create({ path: v })).meta({
  description: "IdShort path to the submodel element (dot-separated)",
  example: "path1.path2.path3",
  param: { in: "path", name: "idShortPath" },
});
export const IdShortPathParam = () => Param("idShortPath", new ZodValidationPipe(IdShortPathParamSchema));

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

export const CursorQueryParam = () => Query("cursor", new ZodValidationPipe(CursorQueryParamSchema));

export const SubmodelRequestBody = () => Body(new ZodValidationPipe(SubmodelRequestDtoSchema));
export const SubmodelElementRequestBody = () => Body(new ZodValidationPipe(SubmodelElementSchema));
