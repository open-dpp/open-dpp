import { AxiosError } from "axios";
import { HTTPCode } from "../stores/http-codes";

export class LimitError extends Error {
  constructor(
    public readonly key: string,
    public readonly limit: number,
    public readonly used: number,
    message: string = "Limit exceeded",
  ) {
    super(message);
    this.name = "LimitError";
  }
}

interface LimitErrorResponse {
  error: string;
  message: string;
  key: string;
  limit: number;
  used: number;
}

/** True if the API rejected the request itself (400): what was sent is unsupported or invalid. */
export function isBadRequestError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === HTTPCode.BAD_REQUEST;
}

export function handleApiError(error: unknown): Error {
  if (error instanceof AxiosError) {
    if (error.response?.status === 429) {
      const data = error.response.data as LimitErrorResponse;
      if (data.key && typeof data.limit === "number" && typeof data.used === "number") {
        return new LimitError(data.key, data.limit, data.used, data.message);
      }
    }

    return error;
  }

  return new Error("unknown error");
}
