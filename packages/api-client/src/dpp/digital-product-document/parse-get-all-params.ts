import type { GetAllParamsDto } from "@open-dpp/dto";

export function parseGetAllParams(params: GetAllParamsDto) {
  return {
    ...(params.pagination && { ...params.pagination }),
    ...(params.populate && { populate: params.populate }),
    ...(params.filter && { ...params.filter }),
  };
}
