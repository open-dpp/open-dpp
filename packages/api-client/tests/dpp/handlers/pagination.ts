import { randomUUID } from "node:crypto";

export const paginationParams = { limit: 10, cursor: randomUUID() };
