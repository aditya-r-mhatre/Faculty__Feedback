# Faculty Feedback (Next.js + MongoDB)

This repository contains a Next.js (App Router) application that provides a faculty feedback system backed by MongoDB and NextAuth (credentials provider).

Below are concise instructions to get the project running locally and to prepare it for publishing to GitHub.

**Important:** Do not commit secrets. Keep any `.env.local` values out of source control.

## Prerequisites

- Node.js 18+ installed
- npm (or yarn / pnpm) available
- A MongoDB connection (Atlas or local)

## Required environment variables

Create a `.env.local` at the repository root with at least:

```bash
MONGODB_URI="your-mongodb-connection-string"
NEXTAUTH_SECRET="a-long-random-string"
NEXTAUTH_URL=http://localhost:3000
```

## Install dependencies

```bash
npm install
```

## Seed the database (optional but recommended for local testing)

The repo includes `seed.ts` which creates example departments, admins, students, faculties, courses, forms and some sample responses.

```bash
# make sure .env.local is configured, then:
npm run seed
```

There is also a destructive helper to clear collections (development only):

```bash
npm run clear-db
```

## Run in development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Build & Start (production)

```bash
npm run build
npm run start
```

## Authentication

- Authentication uses NextAuth credentials provider. The `seed` script creates example admin and student accounts.
- Admins and students are stored in the `admins` and `students` collections respectively (passwords are hashed with bcrypt).

## Key scripts

- `npm run dev` — run Next.js in development mode
- `npm run build` — build for production
- `npm run start` — start production server after build
- `npm run seed` — seed example data into MongoDB
- `npm run clear-db` — clear pre-configured collections (development only)

## Notes for publishing to GitHub

- Ensure `.env.local` is not committed. The repository already includes a `.gitignore` but verify before pushing.
- Consider adding a short `CONTRIBUTING.md` or branch protection policy if this repo will accept collaborators.

## Troubleshooting

- If you see `Please define the MONGODB_URI` error, confirm `.env.local` exists and `MONGODB_URI` is correct.
- If NextAuth complains about session secret, set `NEXTAUTH_SECRET` to a long random value.

## Developer tips

- Models live in `src/models` (Mongoose schemas). API routes are under `src/app/api` (Next.js route handlers).
- Fixed lecture/lab questions are in `src/lib/feedback-questions.ts`.

If you'd like, I can generate a short `CONTRIBUTING.md` and add example `curl` requests for main endpoints (forms, students, auth).
