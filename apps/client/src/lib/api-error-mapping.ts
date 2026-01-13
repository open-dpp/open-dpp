import { AxiosError } from "axios";

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

export function handleApiError(error: unknown): Error {
  if (error instanceof AxiosError) {
    if (error.response?.status === 429) {
      const data = error.response.data as LimitErrorResponse;
      if (data.key) {
        return new LimitError(data.key, data.limit, data.used, data.message);
      }
    }

    return error;
  }

  return new Error("unkown error");
}
