# Contributing to NewsLabs

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Code Style](#code-style)
4. [Branching & Commits](#branching--commits)
5. [Opening a Pull Request](#opening-a-pull-request)
6. [Adding Features](#adding-features)
7. [Known Issues & Limitations](#known-issues--limitations)

---

## Development Setup

Follow the steps in [README.md](./README.md#-getting-started) to set up both the frontend and backend locally.

**Quick checklist:**
- [ ] Node.js >= 18 installed
- [ ] PostgreSQL database available (Supabase free tier works great)
- [ ] `server/.env` created from `server/.env.example` with your Groq and/or Gemini keys
- [ ] `npx prisma db push` run inside `server/` to apply the schema
- [ ] `npm run dev` running in both `/` (port 5173) and `/server` (port 3000)

---

## Project Structure

```
newslabs/
├── src/             # React frontend
│   ├── pages/       # Full-page route components
│   ├── components/  # Reusable components (UI, Navbar, Footer, AIChat)
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions
│   └── services/    # Axios API client functions
└── server/
    └── src/
        ├── routes/   # Fastify route handlers (auth, content, user, ai)
        ├── services/ # Business logic (AiService, RssService, in-memory store)
        └── middleware/ # Fastify preHandlers (requireAuth)
```

---

## Code Style

- **TypeScript** is used throughout — avoid using `any` unless strictly necessary, and always add a comment explaining why.
- **ESLint** is configured — run `npm run lint` before committing.
- **React components** use functional components with hooks. No class components.
- **Tailwind CSS** is used for styling on the frontend.
- **Zod** is used for request body validation in all Fastify routes.
- **Prisma** is the ORM — never write raw SQL unless unavoidable.

---

## Branching & Commits

| Branch pattern | Purpose |
|---|---|
| `main` | Production-ready code |
| `feat/<name>` | New feature |
| `fix/<name>` | Bug fix |
| `chore/<name>` | Maintenance, deps, tooling |
| `docs/<name>` | Documentation only |

**Commit messages** should be short, imperative, and descriptive:
```
feat: add trending topic click-to-filter
fix: correctly handle empty feed on first load
docs: update API reference for /daily-brief
chore: upgrade Fastify to v5.7
```

---

## Opening a Pull Request

1. Fork the repo and create your branch from `main`.
2. Make your changes with clear, focused commits.
3. Run linting: `npm run lint` (frontend) — fix any errors.
4. Run tests: `npm run test` (frontend) — ensure nothing breaks.
5. Open a PR with:
   - A clear **title** summarizing the change.
   - A **description** explaining *why* the change is needed and what it does.
   - Screenshots or recordings for any UI changes.

---

## Adding Features

### New API Endpoint (Backend)

1. Add a new handler inside the relevant file in `server/src/routes/`.
2. Use `z.object(...)` from Zod to validate all request bodies.
3. Use `{ preHandler: requireAuth }` for any route that requires a logged-in user.
4. If adding a new Prisma model, update `server/prisma/schema.prisma` and run `npx prisma migrate dev`.
5. Document the new endpoint in [`API_REFERENCE.md`](./API_REFERENCE.md).

### New Page (Frontend)

1. Create a new file in `src/pages/`.
2. Register the route in `src/App.tsx`.
3. Wrap in `<ProtectedRoute>` if login is required.

### New AI Provider

The `AiService` in `server/src/services/ai.ts` handles AI routing.  
To add a new provider:
1. Add a new private `chat*` / `summarize*` method to the `AiService` class.
2. Extend the `preferredProvider` logic in `summarize()`.
3. Add the new value to the `aiProvider` enum in `server/prisma/schema.prisma` and the Zod schema in `server/src/routes/user.ts`.

---

## Known Issues & Limitations

- **AI Chat (`/api/ai/chat`) is temporarily disabled** — the routes are stubbed. To re-enable, uncomment the handler in `server/src/routes/ai.ts` and the `AIChat` component usage in `DashboardPage.tsx`.
- **AI background categorization is disabled** — articles are categorized via keyword matching instead of Groq. See `server/src/routes/content.ts` for the commented-out `categorizeInBackground` block.
- **Trending Now** uses word frequency, not NLP. Clicking a trending topic does not filter articles yet.
- Article data is stored **in-memory** on the server — restarting the server clears it and requires re-fetching feeds. Persistent article storage is a planned improvement.

---

## Questions?

Open a GitHub Issue with the `question` label. We're happy to help!
