import { setupServer } from "msw/node";
import { statusHandlers } from "./handlers";

export const server = setupServer(...statusHandlers);
