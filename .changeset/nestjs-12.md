---
"@open-dpp/main": patch
---

Upgrade the backend to NestJS 12. Two things operators may notice:

- With `OPEN_DPP_LOG_FORMAT=json`, a log call that passes an object or an error now writes one record instead of two: the object goes into a `params` field, the error into an `error` field with `name`, `message` and `stack`.
- A non-`GET` request to an unknown path outside `/api` (for example `POST /does-not-exist`) now gets the Express HTML 404 page instead of a JSON 404 body. Responses under `/api` and `GET` requests are unchanged.
