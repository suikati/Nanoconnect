# Suggested commands for development (StackBlitz environment)

This project is primarily developed and run on StackBlitz. On your local machine only install dependencies and run formatting/linting as needed — do not start the dev server locally.

IMPORTANT: Do NOT run `pnpm install`, `npm install`, `npm test`, or other commands that modify dependencies or the lockfile on your local machine. Running these locally can change `pnpm-lock.yaml` or `node_modules` and cause the StackBlitz environment to diverge or break.
