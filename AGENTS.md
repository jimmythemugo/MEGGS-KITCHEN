# MEGGS-KITCHEN — Repository Notes

## Project
React 19 + Vite SPA (enterprise kitchenware marketplace) with an Express API server
(`server.ts`) that proxies Google Gemini AI endpoints and serves the built SPA.

## Tooling & Commands
- Package manager: **bun** (lockfile: `bun.lock`). Use `bun install`, `bun add`, `bun remove`.
  Bun is NOT preinstalled in the dev container — install via `curl -fsSL https://bun.sh/install | bash`
  (requires `unzip`) then export `PATH="$HOME/.bun/bin:$PATH"`.
- `bun run lint` → `tsc --noEmit` (typecheck only; this is the project's "lint")
- `bun run test` → `vitest run` (tests in `src/lib/*.test.ts`)
- `bun run build` → `vite build` then `esbuild server.ts` → `dist/server.cjs`
- `bun run dev` → `tsx server.ts` (dev server with Vite middleware)
- `NODE_ENV=production node dist/server.cjs` → runs the built API + static SPA server

## TypeScript config notes (TS 7.x)
- `strict: false` is set explicitly — the codebase was authored non-strict; TS 7 makes
  `strict` default to `true`, so without this many null-handling errors surface.
- `noUncheckedSideEffectImports: false` — preserves `import './index.css'` side-effect imports.
- `types: ["node"]` — TS 7 defaults `types: []`; needed for Node globals (`process`, etc.).
- `baseUrl` was removed (TS 7 dropped it); `paths` use `./`-relative entries.
- `@types/react-dom` is required (react-dom ships no types).

## Dependency quirks
- `lucide-react` v1 removed ALL brand icons (Facebook, Instagram, Linkedin, Twitter, etc.).
  Replacements live in `src/components/ui/brand-icons.tsx` (inline SVGs, same `className` API).
- Express 5 requires named wildcard params: use `app.get('/{*splat}', ...)` instead of `'*'`.
- Vite 8 prefers `import.meta.dirname` over `__dirname` in `vite.config.ts`.
- Tailwind v4 + `@tailwindcss/vite` handle autoprefixing; `autoprefixer` is not needed.

## CI / Dependabot
- `.github/workflows/ci.yml` — typecheck + tests + build (bun) on push/PR.
- `.github/workflows/dependabot-auto-merge.yml` — approves & squash-merges Dependabot PRs
  after CI checks pass.
- `.github/dependabot.yml` — weekly npm + github-actions updates.
