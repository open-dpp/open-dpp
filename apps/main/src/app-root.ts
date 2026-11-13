/**
 * Root directory of the running application code: `apps/main/src` when run from
 * source (tests), `apps/main/dist` (`/app/dist` in Docker) in the Rspack bundle.
 * Every module of the bundle shares one `import.meta.dirname`, so runtime paths
 * are derived from here, never from a per-module dirname.
 */
export const APP_ROOT = import.meta.dirname;
