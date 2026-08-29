# Production

The example deployment (`docker-compose.yml`, started by `scripts/setup.sh`) is for trying open-dpp out locally. It is **not** a production setup: run production with high availability (load balancer, multiple replicas, managed MongoDB and S3) and add the services described here.

All environment variables are listed in the [configuration reference](/reference/configuration).

## Virus scanning (ClamAV)

Uploaded files (passport media, organization logos) are scanned when `OPEN_DPP_CLAMAV_URL` points to a [clamav-rest](https://hub.docker.com/r/ajilaag/clamav-rest) endpoint. When the variable is unset, uploads are accepted **unscanned** and the backend logs a warning at startup. The example and development compose files do not include ClamAV.

Add the service to your stack:

```yaml
services:
  clamav-rest:
    image: ajilaag/clamav-rest
    restart: unless-stopped
```

and point open-dpp at it (the URL includes the port):

```
OPEN_DPP_CLAMAV_URL="http://clamav-rest:9000"
```

ClamAV loads its signature database on start; plan for roughly 1–2 GB of RAM and a short delay before the first scan succeeds. While the scanner is unreachable, uploads are rejected with `The file was denied by our virus scanning system.`
