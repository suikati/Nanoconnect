# Suggested commands for development (StackBlitz environment)

This project is primarily developed and run on StackBlitz. On your local machine only install dependencies and run formatting/linting as needed — do not start the dev server locally.

- Install deps (pnpm, local only): pnpm install
- Do NOT run the dev server locally (do not run `pnpm dev` / `nuxt dev`). Use StackBlitz to start/preview the app instead.
- Format: pnpm format  # runs prettier locally
- Build / Preview: Use StackBlitz's build/preview UI or CI; local `pnpm build` is optional for local checks but not required for development on StackBlitz.

Notes:
- The repo contains `pnpm-lock.yaml` — prefer pnpm for deterministic installs.
- StackBlitz handles hosting; avoid starting long-lived servers on your local machine for this project.
- On Windows, environment variables may differ; since we do not run the server locally there is no need to set HOST locally for development.
