# OpenAI Quick Test

This repository contains a small script to manually test OpenAI-based endpoints locally or on StackBlitz where server execution is supported.

Usage:

1. Ensure `OPENAI_KEY` is set in your environment.

```bash
# Linux/macOS
OPENAI_KEY=sk-... pnpm run test-openai -- playbyplay

# Windows (PowerShell)
$env:OPENAI_KEY = 'sk-...'; pnpm run test-openai -- playbyplay
```

2. To run the comment test:

```bash
OPENAI_KEY=sk-... pnpm run test-openai -- comment
```

Notes:

- Do not commit your API keys. Keep them in environment variables or your deployment platform's secret management.
- StackBlitz may restrict outbound network calls depending on the plan; if so run locally or deploy the server endpoint to Vercel for testing.
