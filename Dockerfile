FROM node:24-slim AS build

ENV CYPRESS_INSTALL_BINARY=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /build

COPY --chown=node:node . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm build

RUN pnpm deploy --filter=@open-dpp/main --prod ./prod/main
RUN pnpm deploy --filter=mcp-server --prod ./prod/mcp

FROM node:24-slim AS production

ENV NODE_ENV=production
ENV OPEN_DPP_BACKEND_MAIN=/app/dist/main.js
ENV OPEN_DPP_FRONTEND_ROOT=/app/dist/client/dist

COPY --chown=node:node --from=build /build/prod/main/dist /app/dist
COPY --chown=node:node --from=build /build/prod/main/node_modules /app/node_modules
COPY --chown=node:node --from=build /build/apps/client/dist /app/dist/client/dist
COPY --chown=node:node /docker/startup.sh /startup.sh

RUN chmod +x /startup.sh

EXPOSE 3000

# Start the server using the production build
CMD ["sh", "-c", "/startup.sh"]

FROM node:24-slim AS mcpserver

ENV NODE_ENV=production

COPY --chown=node:node --from=build /build/apps/mcp/dist /app/dist
COPY --chown=node:node --from=build /build/prod/mcp/node_modules /app/node_modules

EXPOSE 3000

# Start the server using the production build
CMD ["node", "/app/dist/main.js"]