# <div align="center"><img  src="https://github.com/user-attachments/assets/4ecd546b-ad7c-4c1d-bee4-e06518c41ec8" width="100"/> </br>open-dpp</div>

open-dpp is an open-source platform for managing digital product passports (DPPs).

# Getting started

To get up and running quickly, start with the [Getting Started guide](https://docs.open-dpp.de/home/getting-started).

## Try it locally

```bash
curl -fsSL https://raw.githubusercontent.com/open-dpp/open-dpp/main/scripts/setup.sh | bash
```

This downloads the example deployment files, generates local secrets, and starts the full stack with Docker Compose. Then open <http://app.open-dpp.localhost:20080>.

In a cloned repository, run `./scripts/setup.sh` instead.

# Documentation

See the [documentation](https://docs.open-dpp.de) for setup instructions, configuration details, and usage guides.

If you want to contribute to the documentation visit the `docs` folder.

# Contributing

We welcome contributions to both the codebase and the documentation.

Before implementing larger changes, please open an issue first so we can discuss the proposal and align on scope. More information on that can be found in our [contributing guide](./CONTRIBUTING.md).

For day-to-day documentation contributions, you can usually start directly by editing files in the `docs` folder and opening a pull request.
