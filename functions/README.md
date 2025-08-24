# Firebase Functions for Nanosuke-Linka

This folder contains a Firebase Realtime Database trigger that recalculates aggregates for a slide when votes change.

Quick steps to build & deploy:

1. Install dependencies

```bash
cd functions
pnpm install
```

2. Build (TypeScript -> JavaScript)

```bash
pnpm run build
```

3. Deploy (you must have firebase-tools configured and logged in):

```bash
firebase deploy --only functions
```

Notes:
- Ensure your Firebase project is selected (`firebase use`) and billing is configured if necessary for background functions.
- The trigger listens to `/rooms/{roomId}/votes/{slideId}/{anonId}` and writes aggregates to `/rooms/{roomId}/aggregates/{slideId}`.
