# Levee Run

New Orleans distance running landing page — dark/light theme, built with Next.js 15 App Router.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **CSS Modules** for component-scoped styles
- **CSS Variables** for theming (`data-theme="dark"` / `data-theme="light"`)
- **next/image** for optimized background image
- **Bebas Neue + Syne + DM Mono** via Google Fonts

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
levee-run/
├── app/
│   ├── globals.css          # CSS variables, theme tokens, base reset
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main landing page (server component)
│   └── page.module.css      # Page-scoped styles
├── components/
│   ├── ThemeToggle.tsx      # Client component — handles dark/light toggle
│   └── ThemeToggle.module.css
└── public/
    └── levee.jpg            # Background image
```

## Theme System

Themes are driven entirely by CSS variables set on `<html data-theme="...">`.
The `ThemeToggle` client component calls `document.documentElement.setAttribute()`
to switch themes with no flash, no cookies, no context needed.

Dark mode uses phosphor green (`#7fff6a`) accent on near-black (`#0a0a0c`).  
Light mode uses forest green (`#2a6e1a`) on warm off-white (`#f0f2ed`).

## Customizing PRs

Edit the `STATS` array at the top of `app/page.tsx`:

```ts
const STATS = [
  { val: '19:42', label: '5K PR' },
  { val: '41:18', label: '10K PR' },
  { val: '1:33',  label: 'Half PR' },
  { val: '5:52',  label: 'Mile PR' },
]
```
