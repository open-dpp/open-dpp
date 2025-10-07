FROM node:24-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN pnpm install -g turbo @dotenvx/dotenvx

WORKDIR /build

COPY --chown=node:node . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile -P

RUN pnpm build

FROM node:24-slim AS production

ENV NODE_ENV=production
ENV OPEN_DPP_BACKEND_MAIN=/dist/apps/main/dist/main.js
ENV OPEN_DPP_FRONTEND_ROOT=/dist/apps/main/dist/client/dist

COPY --chown=node:node --from=build /build /dist
COPY --chown=node:node --from=build /build/apps/client/dist /dist/apps/main/dist/client/dist
COPY --chown=node:node /docker/startup.sh /startup.sh

RUN chmod +x /startup.sh

EXPOSE 3000

# Start the server using the production build
CMD ["sh", "-c", "/startup.sh"]
