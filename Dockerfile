FROM node:24-slim AS build

ENV CYPRESS_INSTALL_BINARY=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN pnpm install -g rimraf

WORKDIR /build

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node apps/main/package.json apps/main/
COPY --chown=node:node apps/client/package.json apps/client/
COPY --chown=node:node packages/dto/package.json packages/dto/
COPY --chown=node:node packages/api-client/package.json packages/api-client/
COPY --chown=node:node packages/env/package.json packages/env/
COPY --chown=node:node packages/config-eslint/package.json packages/config-eslint/
COPY --chown=node:node packages/exception/package.json packages/exception/
COPY --chown=node:node packages/permission/package.json packages/permission/
COPY --chown=node:node packages/testing/package.json packages/testing/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --chown=node:node . .

RUN pnpm build

RUN pnpm deploy --filter=@open-dpp/main --prod ./prod/main

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