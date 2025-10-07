###################
# BUILD FOR LOCAL DEVELOPMENT
# Thanks to https://www.tomray.dev/nestjs-docker-production
###################

FROM node:24-alpine AS development
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

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD BACKEND FOR PRODUCTION
###################

FROM node:24-alpine AS build-backend
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/root/.local/share/pnpm \
    PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
RUN pnpm add -g turbo
ARG APP_NAME=main

# WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node pnpm-lock.yaml ./

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN pnpm run build

# Set NODE_ENV environment variable
ENV NODE_ENV=production

# Running `npm ci` removes the existing node_modules directory and passing in --only=production ensures that only the production dependencies are installed. This ensures that the node_modules directory is as optimized as possible
# RUN pnpm i -P

USER node

###################
# BUILD FRONTEND FOR PRODUCTION
###################

#FROM node:24-alpine AS build-frontend
#ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
#    PNPM_HOME=/root/.local/share/pnpm \
#    PATH=/root/.local/share/pnpm:$PATH
#RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
#RUN pnpm add -g turbo
#
#WORKDIR /usr/src/frontend
#
#COPY --chown=node:node ./apps/client/package*.json ./
#COPY --chown=node:node pnpm-lock.yaml ./
#
#RUN pnpm install
#
#COPY --chown=node:node ./apps/client .
#
## Run the build command which creates the production bundle
#RUN pnpm run build

###################
# PRODUCTION
###################

FROM node:24-alpine AS production
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/root/.local/share/pnpm \
    PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
RUN pnpm add -g turbo

ARG APP_NAME=main
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
ENV OPEN_DPP_BACKEND_MAIN=/dist/apps/${APP_NAME}/main.js
ENV OPEN_DPP_FRONTEND_ROOT=/dist/apps/client/dist

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build-backend /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build-backend /usr/src/app/dist ./dist
#COPY --chown=node:node --from=build-frontend /usr/src/frontend/dist ./dist/apps/client/dist
COPY --chown=node:node /docker/startup.sh /startup.sh

RUN chmod +x /startup.sh

EXPOSE 3000

# Start the server using the production build
CMD ["sh", "-c", "/startup.sh"]

