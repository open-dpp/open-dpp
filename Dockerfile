###################
# BUILD FOR LOCAL DEVELOPMENT
# Thanks to https://www.tomray.dev/nestjs-docker-production
###################

FROM node:24-alpine AS prune
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/root/.local/share/pnpm \
    PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
RUN pnpm add -g turbo

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package*.json ./
COPY --chown=node:node pnpm-lock.yaml ./

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN pnpm i --frozen-lockfile

# Bundle app source
COPY --chown=node:node . .

RUN turbo prune main --docker

# Use the node user from the image (instead of the root user)
USER node

###################
# PRODUCTION
###################

FROM node:24-alpine AS production

ENV NODE_ENV=production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=prune /usr/src/app/.out .out
#COPY --chown=node:node --from=build-frontend /usr/src/frontend/dist ./dist/apps/client/dist
COPY --chown=node:node /docker/startup.sh /startup.sh

RUN chmod +x /startup.sh

EXPOSE 3000

# Start the server using the production build
CMD ["sh", "-c", "/startup.sh"]

