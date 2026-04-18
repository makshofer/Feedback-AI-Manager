# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TanStack Query, wouter, shadcn/ui, Tailwind CSS, Framer Motion
- **Auth**: JWT (SESSION_SECRET), bcryptjs
- **AI**: OpenAI (GPT-4o-mini for analysis, Whisper for transcription)

## Applications

### Feedback AI Assistant (`artifacts/feedback-ai`)
A B2B SaaS tool for collecting and processing executive feedback using AI.
- Landing page with product description
- Auth system (login/register) with role-based access (admin/manager)
- Manager dashboard: submit feedback (text/voice), history, edit/resubmit
- Admin dashboard: user management, stats, cohort analysis, activity feed

### API Server (`artifacts/api-server`)
Express 5 backend serving all API endpoints.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Demo Accounts

- **Admin**: username `admin`, password `admin123`
- **Manager 1**: username `manager1`, password `manager123`
- **Manager 2**: username `manager2`, password `manager123`

## Environment Variables

- `SESSION_SECRET` — JWT signing secret (required)
- `OPENAI_API_KEY` — OpenAI API key for AI analysis and voice transcription (optional, features degrade gracefully)
- `TELEGRAM_BOT_TOKEN` — Telegram bot token (for future Telegram integration)

## API Routes

- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `GET /api/auth/me` — Get current user
- `GET/POST /api/feedbacks` — List/create feedbacks
- `GET/PATCH/DELETE /api/feedbacks/:id` — Feedback CRUD
- `POST /api/feedbacks/transcribe` — Audio transcription via Whisper
- `POST /api/feedbacks/analyze` — Text analysis via GPT-4o-mini
- `GET/PATCH /api/users` — User management (admin only)
- `GET /api/admin/stats` — Dashboard statistics (admin only)
- `GET /api/admin/cohort` — Cohort analysis (admin only)
- `GET /api/admin/activity` — Activity feed (admin only)
- `GET/POST /api/projects` — Projects

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
