# Deploying to Vercel

This repository is ready to deploy as a Next.js project on Vercel.

## Deploy from GitHub

1. Sign in to [Vercel](https://vercel.com) with GitHub.
2. Select **Add New → Project**.
3. Import `skim0130/KSNVE-Conference-app`.
4. Keep the detected framework preset as **Next.js**.
5. Keep the project root as the repository root (`.`).
6. Use the default install and build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: leave unset (managed by Next.js)
7. Select **Deploy**.

### Environment variables

Add these in **Project Settings → Environment Variables** (Production and
Preview). `.env.local` is git-ignored, so it never reaches Vercel's build —
this has to be set in the dashboard too.

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL` | Published Google Sheet CSV URL for live-editable notices. See `README.md` → "공지사항 (구글 시트)". Optional — without it the app falls back to `data/announcements.json`. |

Pushes to `main` will trigger new production deployments after the GitHub
repository is connected to Vercel.

## Verify locally

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## PWA and static export notes

- `public/manifest.json` is linked from `app/layout.tsx`.
- The app does not currently register a service worker, so offline caching is not
  enabled.
- Next.js static export (`output: 'export'`) is not enabled and is not required
  for Vercel. Vercel should use the standard Next.js build output.
- Paper and session detail routes are prerendered through `generateStaticParams`.

## Optional custom domain

After deployment, open **Project Settings → Domains** in Vercel to attach a
custom domain. Vercel provides a public `*.vercel.app` address automatically.
