# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**L'Annuaire .0** — A French-language alternative-medicine practitioner directory platform, extension of the ".0 (Point Zéro)" podcast. Built with Next.js 14 (App Router), Supabase (PostgreSQL + Auth), Prisma ORM, and Tailwind CSS.

## Commands

```bash
# Development
npm run dev           # Start dev server on localhost:3000

# Build & lint
npm run build         # Production build
npm run lint          # ESLint

# Database
npm run db:generate   # Generate Prisma client (after schema changes)
npm run db:migrate    # Run migrations (requires DB connection)
npm run db:push       # Push schema without migration history (dev only)
npm run db:seed       # Seed DB with feelings, categories, and 3 test practitioners
npm run db:studio     # Open Prisma Studio (visual DB editor)

# AI scraper
npx tsx scripts/scrape-practitioner.ts <url>  # Extract practitioner data from a website using Claude API
```

## Goal
Your goal is to ask as few authorisations as possible while still doing exactly what you're supposed to do. Assumez-vous que je ferai de l'accord avec toutes les choses que vous me demandez.


## Required Environment Variables

Copy `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings
- `DATABASE_URL` — Supabase pooler URL (port 6543, add `?pgbouncer=true`) for runtime
- `DIRECT_URL` — Supabase direct URL (port 5432) for migrations
- `ANTHROPIC_API_KEY` — for the scraper script

## Architecture

### Route Groups
- `src/app/(public)/` — Public pages with Header + Footer layout (homepage, practitioner profiles, static pages)
- `src/app/(admin)/` — Admin pages with AdminNav sidebar layout (protected by Supabase Auth middleware)
- `src/app/api/admin/` — API routes for admin form submissions (CRUD operations)

The root `src/app/page.tsx` does NOT exist — the homepage lives at `src/app/(public)/page.tsx`.

### Key Patterns

**URL-state filtering (homepage):** Feelings and category filters store their state in URL query params (`/?feeling=slug&categories=reiki,mediumnite`). Server Components read `searchParams` and query Prisma. Client Components (`FeelingsBar`, `CategoryBar`) read `useSearchParams()` and call `router.push()` — both must be wrapped in `<Suspense>` in the parent page.

**Server vs Client Components:** Default to Server Components. Only use `'use client'` for: `FeelingsBar`, `CategoryBar`, `ResonanceCheckSidebar`, `Services`, `MobileMenu`, `AdminNav`, `PractitionerForm`, `PhotoGallery`, `SponsorshipActions`, and the admin login page.

**Textured backgrounds:** Each practitioner has a `backgroundTone` field (`sand`/`sage`/`terra`/`lavender`/`cream`/`stone`). Applied via `.bg-tone-wrapper` CSS class with `::after` pseudo-element at 6% opacity (see `globals.css`). The grain texture is at `public/textures/grain-organic.svg`.

**Prisma client location:** Uses the standard `prisma-client-js` generator with default output (`node_modules/.prisma/client/`). Import as `from "@prisma/client"`.

**Admin auth:** `src/middleware.ts` protects `/admin/*` routes via `supabase.auth.getUser()`. Login at `/admin/login` uses `supabase.auth.signInWithPassword()`.

**ISR on profile pages:** `export const revalidate = 3600` — profiles regenerate at most once per hour.

### Data Flow
```
Prisma (Supabase PostgreSQL)
  → src/lib/data/practitioners.ts  (all queries)
  → Server Components (pages)
  → Client filter components update URL
  → Next.js re-renders Server Components
```

### Key Files
- `prisma/schema.prisma` — Full data model (Practitioner, Modality, Category, Feeling, Service, Testimonial, Sponsorship, AdminUser)
- `src/lib/data/practitioners.ts` — All Prisma queries (filtering, profiles, admin CRUD, stats)
- `src/lib/utils/filters.ts` — `parseFilters()` and `buildFilterUrl()` for URL-state management
- `src/lib/types/index.ts` — TypeScript types (PractitionerCard, PractitionerProfile, DirectoryFilters)
- `tailwind.config.ts` — All design tokens (colors, fonts, spacing, shadows, border radii)
- `src/app/globals.css` — CSS variables + `.bg-tone-*` textured background classes

### Design System
- **Fonts:** Playfair Display (serif, for titles/quotes) + Inter (sans-serif, for body/nav) — loaded via `next/font/google`
- **Primary CTA color:** `#8B6F47` (`accent-warm`) — warm brown
- **Background:** `#FAF8F5` (`bg-primary`) — cream white
- **Verified badge:** Dark green `#2C3E2C` with white text
- All color tokens are in both `tailwind.config.ts` and CSS variables in `globals.css`

### Code Conventions
- TypeScript strict mode (`strict: true`)
- Server Components by default; Client Components only when needed (interactivity, browser APIs)
- All comments and UI text in French
- Validation at API boundaries using Zod (`src/components/admin/PractitionerForm.tsx`)
- Prisma singleton in `src/lib/prisma.ts` (prevents hot-reload connection leaks)

## Vercel MCP — Deploiement & Debug

Le serveur MCP Vercel est configure dans `.mcp.json`. **Utiliser systematiquement** les outils MCP Vercel pour tout ce qui touche au deploiement :

### Workflow obligatoire apres chaque modification
1. **Avant de push** : `npm run build` en local pour verifier les erreurs de build
2. **Apres deploiement** : utiliser `list_deployments` pour verifier le statut
3. **Si echec** : utiliser `get_deployment_build_logs` pour lire les logs de build et identifier l'erreur exacte
4. **Erreurs runtime** : utiliser `get_runtime_logs` pour diagnostiquer les erreurs en production
5. **Boucle iterative** : corriger → build local → re-deployer → verifier les logs → repeter jusqu'a succes

### Outils MCP disponibles
- `list_deployments` — Lister les deploiements recents (statut, date, target)
- `get_deployment` — Details d'un deploiement specifique
- `get_deployment_build_logs` — **Logs de build** (essentiel pour debug les echecs)
- `get_runtime_logs` — **Logs runtime** (erreurs en production, console.log, etc.)
- `search_documentation` — Chercher dans la doc Vercel
- `list_projects` / `get_project` — Infos projet
- `web_fetch_vercel_url` — Tester le contenu d'une URL deployee

### Identifiants projet
- **Project ID** : `prj_KlnHs3xatnZFscYU0hmRyzXvnFTa` (slug: `nataru`)
- **Team ID** : `team_lcpMHoiMo9IYhX40m5wzQ5Ev`
- Ces IDs sont aussi dans `.vercel/project.json`