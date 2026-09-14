---
"@open-dpp/main": minor
---

The development and example compose stacks now run [RustFS](https://rustfs.com) instead of MinIO for S3-compatible object storage (MinIO's community images and repositories were archived in 2025). The `minio` and `minio-init` services are replaced by `rustfs` (server, S3 API on 9000, console on 9001) and `rustfs-init` (`rustfs/rc`, creates both buckets with object versioning; no public-read policy any more, nothing reads the buckets anonymously). The application itself is unchanged: it still talks plain S3 through the same `OPEN_DPP_S3_*` variables, and any S3-compatible store keeps working.

Existing example-stack deployments (`docker-compose.yml`) have to update `.env`: set `OPEN_DPP_S3_ENDPOINT="rustfs"` and pick new `OPEN_DPP_S3_ACCESS_KEY` / `OPEN_DPP_S3_SECRET_KEY` values (`./scripts/setup.sh` generates the secret for fresh installs). Objects stored in the old `minio_data` volume are not migrated automatically; copy them into the new store (for example with `rc mirror` or `aws s3 sync`) before removing the MinIO container.
