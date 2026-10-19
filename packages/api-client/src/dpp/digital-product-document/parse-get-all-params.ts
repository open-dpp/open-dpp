import type {
  GetAllActivitiesParamsDto,
  GetAllParamsDto,
  GetAllPassportsParamsDto,
} from "@open-dpp/dto";

export function parseGetAllParams(params: GetAllParamsDto) {
  return {
    ...(params.pagination && { ...params.pagination }),
    ...(params.populate && { populate: params.populate }),
    ...(params.filter && { ...params.filter }),
  };
}

export function parseGetAllPassportsParams(params: GetAllPassportsParamsDto) {
  const { templateIds, ...filter } = params.filter ?? {};
  return {
    ...parseGetAllParams({ ...params, filter }),
    ...(templateIds && { templateId: templateIds }),
  };
}

export function parseGetAllActivitiesParams(params: GetAllActivitiesParamsDto) {
  return {
    ...(params.period && { ...params.period }),
    ...(params.pagination && { ...params.pagination }),
    ...(params.filter && { ...params.filter }),
  };
}
