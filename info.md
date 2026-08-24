# zipline-phase — info.md

`zipline-phase` is a personal fork of [Zipline](https://github.com/diced/zipline), the next-generation
ShareX / file upload server. It keeps all of upstream Zipline v4 and adds a set of "Phase" customizations
(admin prank links, an embed builder, login-page customization, a built-in `phase_dark` theme, avatar
upload, and a custom code-highlighting language map).

> [!NOTE]
> This fork is "for fun" and will not be updated often. Use the pinned image digests in `README.md`.

---

## What the code does

It is a full-stack file / URL sharing platform:

- A **Fastify** API server handles auth, uploads, URL shortening, embeds, admin tasks, and an OpenAPI
  spec.
- A **React 19 + Mantine** dashboard (client-side SPA served by the same server) is the user/admin UI.
- A **Prisma** ORM backed by **PostgreSQL** stores users, files, urls, folders, tags, tokens, etc. Files
  themselves are stored on the local filesystem or on S3.
- `zipline-ctl` is a CLI (`src/ctl`) for server management.

The custom "Phase" logic lives alongside the upstream code:
- `src/lib/trollStore.ts` + `src/server/routes/troll.ts` + `src/server/routes/api/troll.ts` + the
  `troll` admin page — a prank-link system.
- `src/server/routes/embed.ts` + `SettingsEmbedBuilder.tsx` — a custom OG/Discord embed builder.
- `src/components/pages/loginCustomiser` + `src/client/pages/dashboard/admin/login-customiser.tsx` —
  admin "Phase group" login-page customizer.
- `src/lib/theme/builtins/phase_dark.theme.json` + `src/lib/config/validate.ts` — the built-in
  `phase_dark` theme (now the default).
- `code.json` — a custom 40+ language map for in-browser code viewing.

---

## Features

### Upstream Zipline features (inherited)
- Quick Docker setup + configuration
- Upload any file; folders; tags; URL shortening
- Embeds; Discord + HTTP webhooks; OAuth2 (Discord/GitHub/Google/OIDC)
- 2FA (TOTP) and passkeys (WebAuthn)
- Password-protected files & urls; image compression; video thumbnails
- Full REST API + OpenAPI docs; PWA; partial/chunked uploads
- Invites; per-user quotas; custom themes; v3→v4 import; metrics
- Local and S3 datasources; rate limiting

### Phase-edition additions
- **Troll prank links** (admin only): create disguised full-screen links under `/data/<alias>` that
  render an image, gif, video, or YouTube embed. Comes with a preset library (Rickroll, Nyan Cat,
  Trollface, Doge, Bonk, Pikachu, Spinning Horse, Shrek) or a custom URL. Links are persisted to
  `./data/troll-links.json` and track **view counts**.
- **Embed Builder**: build a custom Discord-style embed (site name, title, description, accent color,
  image) encoded into a compact `?data=` URL at `/embed`, rendered as an OG card. Payload uses
  single-letter keys (`t/d/c/s/i`) with legacy full-key backwards compatibility.
- **Login Customiser** (admin "Phase" group): change the site title, logo URL, and full-screen login
  background (with optional blur) via a live preview.
- **`phase_dark` built-in theme**: a new built-in dark theme, set as the default
  (`builtin:phase_dark`).
- **Avatar / PFP upload**: client-side resize to 256vs×256 JPEG (80%) before upload.
- **Custom code language map** (`code.json`): ~40 syntax-highlighted languages for code/text file
  viewing (HTML, CSS, C++, JS, Python, Ruby, Java, Go, Rust, TS, Lua, Kotlin, etc.).

---

## Tech stack
- **Backend:** Fastify 5, Prisma 7 + PostgreSQL, Zod (typed routes), sharp (images), argon2,
  `@simplewebauthn`, `@aws-sdk/client-s3`
- **Frontend:** React 19, React Router 7, Mantine 9, SWR, zustand, Vite 8
- **Tooling:** TypeScript 7, oxlint + oxfmt, tsup, pnpm, Nix/Flake dev shell, Docker

## Key commands
```bash
pnpm install        # install deps
pnpm dev            # dev server (hot reload)
pnpm build          # build production
pnpm start          # run production server
pnpm ctl help       # server CLI
pnpm validate       # lint + format check (required for build)
pnpm db:migrate     # create a prisma migration
```

## Project layout
```
src/server   Fastify server: routes, plugins, middleware, startup
src/client   React SPA: pages, components, hooks
src/lib      shared libs: trollStore, themes, config validation, code.json loader
src/ctl      CLI management tool
prisma       database schema + migrations
docker       Docker / compose files
scripts      build, validate, openapi generators
```
