# UserBase — Users Dashboard

A Linear-style admin dashboard for browsing, searching, filtering, and analysing 208 users from the [DummyJSON API](https://dummyjson.com/docs/users). Built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS v4** — styled with Manrope + JetBrains Mono and an OKLCH design-token palette.

Ships with a built-in **AI chat assistant** that can answer aggregate questions about the dataset *and* drive the dashboard UI via tool calls (ask *"show only female moderators"* and the filter chips actually change). Three swappable providers — a keyless **Demo** via a Cloudflare Worker proxy, **Anthropic Claude**, and **Google Gemini** — picked in the chat settings.

**Live:** [olegmikhaylov0001.github.io/users-dashboard](https://olegmikhaylov0001.github.io/users-dashboard/)

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build (static export — pre-renders all 208 user pages)
npm start       # serve the production build
```

To enable the keyless **Demo** chat provider locally:

```bash
cp .env.local.example .env.local
# fill NEXT_PUBLIC_DEMO_WORKER_URL with your Cloudflare Worker URL
```

See [`worker/README.md`](worker/README.md) for the ~10-minute Cloudflare setup.

---

## What's inside

### Dashboard (`/`)

A single-page client dashboard. All 208 users are fetched server-side on first load (ISR, revalidates every 5 min), then every interaction — filtering, sorting, search — happens instantly in memory without a network round-trip.

**Sidebar** (224 px, hidden under 900 px)
- Workspace logo + dropdown header
- Command-style search button with `⌘K` hint
- Primary nav: Users / Charts / Admins / Invitations (with live counts)
- **Saved views** section — preset filters (Engineering / HR team / Marketing / Leadership) with member counts that update with the dataset
- **Workspace** section — Departments / Tags / Settings
- Footer with the current user avatar + notifications bell

**Topbar** (44 px)
- Breadcrumb "Workspace / Users / {count}"
- Inline search across name, email, username (with `/` keyboard hint)
- Export · Theme toggle · "+ Invite" primary button

**Filter bar**
- **View tabs**: All / Admins / Mods / Female / Male — each with a live count chip; flips the working set on top of the regular filters
- **Popover filter chips**: Role / Department / Gender / Title / Country / State. The Department / Title / Country / State chips have an inline search inside the popover (handy with ~100 distinct values)
- "Reset" appears when any filter is active; "Save view" on the right

**KPI strip** (4 columns)
- TOTAL · FILTERED — `{matched} / {total}`
- ADMINS — count + percentage
- AVG AGE · TOP DEPT — rounded average + most common department
- GENDER · AGE DIST — `%F` ratio + inline 5-bucket SVG sparkline of age distribution

**User table** (default view)
- Columns: User (avatar + name + email) · Role (dot + label) · Department (chip) · Title · Age · Location · "⋯" actions
- Sortable headers; selection checkboxes; cursor row indicator
- Empty state with a "Clear filters" CTA if the current filter slice has no matches

**Side panel** (380 px, slides in from the right when a row is clicked)
- Header: large avatar + status dot · `USR-{id}` chip · role badge · name · `{title} · {department}`
- Tabs: **Overview** (Contact / Profile / Work / System sections) · **Activity** (recent events) · **Permissions** (granted scopes per role)
- Footer: Message · Edit · Open (full profile)
- Keyboard nav: `J`/`↓` next user, `K`/`↑` prev, `Esc` close

**Status bar** (28 px)
- Sync indicator · `Showing N of 208` · active filter count · keyboard shortcut hints

### AI chat assistant (floating widget, bottom-right)

A floating action button opens a chat panel ("Ask about these users"). The agent supports **three providers** picked in the settings dialog:

| Provider | Default model | Pricing | When to use |
|---|---|---|---|
| **Demo** *(when configured)* | `:free` fallback chain via OpenRouter (Llama 3.3 70B → Qwen 3 80B → GPT-OSS 120B → GLM 4.5) | Free — shared CF Worker, rate-limited per IP | Default for visitors who don't want to provision anything |
| **Anthropic** | `claude-sonnet-4-6` | Paid — user's own key | Best quality, complex multi-step reasoning |
| **Google** | `gemini-2.5-flash` | Free tier (~10 RPM / 250 RPD) | Dev / testing without a Worker setup |

All three providers route through the same **five tools**:

| Tool | What it does |
|---|---|
| `get_users_stats` | Counts, averages, age buckets, top-N breakdowns over any filter slice |
| `query_users` | Returns a sample of matching users (up to 20 rows) with selected fields |
| `apply_filters` | **Sets the actual dashboard filter chips** — the table re-renders live |
| `clear_filters` | Resets all dashboard filters |
| `open_user` | Opens the user side panel by id |

**Header chip** in the chat shows the active provider (`Claude ▾`, `Gemini ▾`, `Demo ▾`) — click it to open settings and switch in one motion.

**Tool-use loop** runs up to 6 iterations per turn, so the agent can chain calls — e.g. *"reset filters and open Ava Taylor's card"* triggers `clear_filters` → `query_users` → `open_user` in a single response.

**Diff + Undo card** appears under every assistant message that called `apply_filters` or `clear_filters`. It lists the per-field changes (e.g. `role: — → moderator`, `gender: — → female`) and an Undo button that restores the previous filter snapshot.

**Slash commands** (handled locally where possible)

| Command | Effect |
|---|---|
| `/help` | Lists available commands (local — no LLM call) |
| `/clear` | Wipes chat history + cost meter (local) |
| `/cost` | Prints session token + dollar breakdown (local) |
| `/explain` | Templated prompt summarising the current filter state |
| `/compare A and B` | Templated prompt comparing two users |

**Cost meter** in the header tallies session input/output tokens and dollar cost using each provider's pricing table.

**Rate limiting**: max 30 tool calls per 60-second sliding window per browser tab — protects against runaway loops.

**Demo rate-limit UX**: when the Demo provider's per-IP quota is exhausted, the chat shows an amber banner with one-click "Use my Claude key" / "Use my Gemini key" buttons that switch the provider and open the key-input dialog.

Verified end-to-end:

- *"Avg age of engineering users in the US"* → calls `get_users_stats`, replies *"33 years, 19 users, 42% female, ages 25-46"*
- *"Show only female moderators"* → calls `apply_filters`, chips in the dashboard update, list shows 5 users
- *"Reset filters and open Ava Taylor's card"* → 3 tool calls in sequence, side panel opens

### User detail page (`/users/[id]`)

208 static pages pre-rendered at build time via `generateStaticParams`. Each page shows the complete user record organised in labelled sections: Personal · Contact & Address · Company · Banking · Crypto · System.

PII notes: card number, IBAN, and EIN fields are omitted — they serve no analytical purpose and shouldn't be casually exposed in a dashboard UI.

### Theme system

Light theme by default (`data-theme="light"` on `<html>`). Dark theme variables ship for a future toggle. A custom Tailwind variant ties `dark:` classes to `data-theme="dark"` instead of `prefers-color-scheme`, so the chat widget follows the app theme rather than the OS — important when the rest of the dashboard is locked to light.

---

## Architecture decisions

### Why client-side state instead of URL params

The initial prototype stored filters in URL search params, which is ideal for bookmarkability. It was replaced because:

1. DummyJSON doesn't support combining filters server-side. To filter by role AND department AND age, you have to fetch all users and filter in JS anyway.
2. Continuous-value filters (search) debounced into the URL add complexity with no real payoff for a dataset this size.
3. 208 records is ~50 KB JSON. Keeping everything in memory and filtering client-side is instantaneous and doesn't require a server round-trip per interaction.

The trade-off is that filter state is lost on refresh. Acceptable for an internal admin tool where most sessions are fresh.

### Why fetch all users at once

DummyJSON's `/users` endpoint accepts a single `search` or `filter[field]` query — not multiple. To support six simultaneous filters (role, gender, department, title, country, state) you need the full dataset on the client. `page.tsx` (Server Component) fetches once with `next: { revalidate: 300 }` and passes the array as a prop.

### Why no chart library

Recharts, Victory, Chart.js all add ≥50 KB to the bundle for what the KPI strip needs — a single 5-bar sparkline. The shape (rect's with computed heights) fits in a dozen lines of hand-written SVG. Full control over the OKLCH accent colour and zero bundle cost.

### Why a side panel instead of a modal

An earlier iteration used a centred overlay modal — fine for a "popup" but it blocks the entire dashboard whenever a row is inspected. The current side panel keeps the table visible, supports keyboard nav between rows (`J`/`K`), and matches the Linear-style admin convention. The cost is the additional 380 px of width budget when open; under 900 px the panel goes full-screen.

### Demo provider — shared OpenRouter proxy via Cloudflare Worker

The demo provider exists so a casual visitor can try the chat without signing up for any LLM service. It routes through a small Cloudflare Worker (~150 lines in [`worker/src/index.ts`](worker/src/index.ts)) that:

```
Browser (GitHub Pages)        Cloudflare Worker             OpenRouter
─────────────────────         ──────────────────            ──────────────
POST /chat               ──→  + Bearer key from env  ──→   :free model
{messages, tools}             + per-IP rate limit          (Llama 3.3 70B,
                              + origin allowlist            Qwen 3 80B,
                              + model fallback chain        GPT-OSS, …)
                         ←──  + CORS headers          ←──
```

- The OpenRouter key lives **only** in the Worker's environment (`wrangler secret put`). It never enters the dashboard bundle, never enters git.
- Per-IP rate limit (10 req/min, 50/day, both adjustable in `wrangler.toml`) caps abuse at quota exhaustion — not a bill.
- **Ordered fallback chain** in `wrangler.toml` (`MODELS`, comma-separated). The Worker tries each model in sequence — on upstream 429 (provider-side rate-limit, common on `:free` tier) it transparently falls through to the next. The model that actually answered is reported in the `x-served-by-model` response header.
- When the entire chain returns 429, the chat surfaces an inline "use my Claude/Gemini key" CTA that hot-swaps the provider.

See [`worker/README.md`](worker/README.md) for the full Cloudflare setup. On the dashboard side, set:

```bash
# .env.local (dev)
NEXT_PUBLIC_DEMO_WORKER_URL=https://users-dashboard-chat.<your-name>.workers.dev/chat
```

…and add the same as a repo variable in GitHub Actions for production builds.

### Why three providers behind one interface

The chat ships with **Anthropic**, **Google**, and the optional **Demo** (OpenRouter via Cloudflare Worker) behind a small registry ([`app/lib/providers.ts`](app/lib/providers.ts)). The registry exposes a `runChat` function with an identical signature for every provider; the message format, tool schemas, and `ChatUsage` shape are normalised, and each provider's adapter translates to its native wire format — Anthropic Messages API for Claude, `generativelanguage.googleapis.com/v1beta` for Gemini, OpenAI Chat Completions for OpenRouter.

Three reasons for the split:

1. **Dev cost** — Gemini 2.5 Flash is free up to 250 requests/day. Day-to-day work on new tools, slash commands, and the agent loop no longer burns Anthropic credits.
2. **Portability** — adding GPT-4 / Mistral / DeepSeek in future is a single new adapter file plus one entry in the registry. The UI, cost meter, slash commands, and tool executor are provider-agnostic.
3. **Portfolio signal** — multi-provider thinking with a normalised internal format is a senior pattern (LangChain / Vercel AI SDK do something similar). It also gives a natural foundation for **model routing** (a cheap classifier picks the provider per query) in a future PR.

The Anthropic adapter posts JSON to `api.anthropic.com/v1/messages` with `anthropic-dangerous-direct-browser-access: true`. The Gemini adapter posts to `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...`; it also strips JSON-Schema keywords Gemini rejects (`additionalProperties`, `$schema`, `default`, empty `enum` entries) and maintains a tool-call-id → name map so cross-provider message history round-trips cleanly. The OpenRouter adapter speaks OpenAI Chat Completions format and routes through the Worker.

### Why the keyed providers call the LLM directly from the browser

The dashboard is published as a static export (`output: "export"` in `next.config.ts`) so it can be hosted on GitHub Pages — there is no Node server at runtime, so there is no API route that could hold an API key.

Two options exist for keyed providers:

1. **Direct browser → provider calls.** The user pastes their own API key into the settings dialog; it lives in `localStorage` (`ud_anthropic_key` / `ud_google_key`) and never leaves the browser.
2. A Cloudflare Worker / Vercel Edge function as a proxy with the key in `env` — which is exactly what the Demo provider does.

Both ship side-by-side. Option 1 keeps the *keyed* flows a true static site and lets reviewers try the chat with their own key without provisioning anything. Option 2 (Demo) gives visitors a zero-setup path while keeping the OpenRouter key off the client.

### Why a React Context for tool execution

Chat tools like `apply_filters` need to mutate the same state that the rest of the dashboard reads from (`useDashboard`). Threading those setters through props from `Dashboard.tsx` → `ChatWidget.tsx` would require lifting actions through every intermediate component. Instead a small `DashboardCtx` exposes only what tools need (`users`, `setFilter`, `applyPreset`, `clear`, `onAgeChange`, `setSelected`, `getCurrentFilters`). The chat widget pulls actions from context; `useDashboard` remains the single source of truth.

### Component structure

```
app/
├── hooks/
│   └── useDashboard.ts     # all dashboard state, filters, sort, selection, stats
├── lib/
│   ├── api.ts              # fetch wrapper with ISR cache
│   ├── palette.ts          # deterministic colour palette for avatars
│   ├── users.ts            # getFilterOptions (extract unique depts, countries…)
│   ├── anthropic.ts        # Anthropic Messages API client + tool-use agent loop
│   ├── gemini.ts           # Google Gemini v1beta client + schema cleanup
│   ├── openrouter.ts       # OpenAI-format client targeting our Cloudflare Worker
│   ├── providers.ts        # registry — selects runChat + pricing per provider id
│   ├── pricing.ts          # per-provider token pricing tables + cost helpers
│   └── chatTools.ts        # tool schemas (zod) + executor (5 tools)
├── components/
│   ├── Dashboard.tsx       # layout shell — wires hooks + KPI strip + table
│   ├── Sidebar.tsx         # workspace + nav + saved views + workspace + footer
│   ├── ChatWidget.tsx      # FAB + chat panel + settings + cost meter + Undo cards
│   ├── icons.tsx           # Linear-style SVG icon set
│   ├── dashboard-ctx.ts    # Context exposing dashboard actions to chat tools
│   ├── ui/
│   │   └── FilterChip.tsx  # searchable popover-based filter chip
│   └── users/
│       ├── UserTable.tsx   # sortable table with selection checkboxes
│       └── SidePanel.tsx   # slide-in detail panel (Overview/Activity/Permissions)
├── users/[id]/
│   ├── page.tsx            # static detail page (208 pages pre-rendered)
│   └── loading.tsx
├── globals.css             # design tokens (OKLCH) + Linear-style component classes
└── layout.tsx              # Manrope + JetBrains Mono fonts, data-theme="light"

worker/                     # Cloudflare Worker (Demo provider proxy)
├── src/index.ts            # CORS + rate-limit (KV) + model fallback chain
├── wrangler.toml           # config — bindings, vars, secrets refs
├── package.json
└── README.md               # 5-command Cloudflare setup
```

`Dashboard.tsx` is intentionally thin — it composes hooks, owns the active-view + tab + selection state, and renders the layout. Domain logic lives in hooks (`useDashboard`), data adapters live in `lib/`, presentational pieces live in `components/`.

### Mobile

Below 900 px the sidebar collapses (CSS `display: none`), the main column takes the full width, the KPI strip drops to a 2-column grid, and the side panel becomes a full-screen overlay anchored to the right (`position: fixed`). The chat widget panel clamps to `calc(100vw - 2rem)` so it stays in viewport.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16.2 (App Router, static export) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS v4 + custom OKLCH design tokens |
| Fonts | Manrope (sans), JetBrains Mono (mono) — Google Fonts via `next/font` |
| Data | [DummyJSON](https://dummyjson.com) — no account needed |
| Charts | Hand-written SVG (no chart library) |
| Schema validation | [zod](https://zod.dev/) ≥4 — guards every chat tool input |
| LLM clients | Custom fetch-based — Anthropic Messages API, Google Gemini v1beta, OpenAI Chat Completions (via OpenRouter through the Worker). No SDK dependencies. |
| Demo proxy | Cloudflare Worker (`worker/`) — KV-backed rate limiter, model fallback chain |
| Hosting | GitHub Pages (dashboard) + Cloudflare Workers (Demo proxy) |

---

## Using the chat assistant

1. `npm run dev`, open `http://localhost:3000`.
2. Click the blue chat button in the bottom-right corner.
3. In the settings dialog pick a provider:
   - **Demo (no key — free tier)** — shows up only when `NEXT_PUBLIC_DEMO_WORKER_URL` is configured. Uses the project's Cloudflare Worker proxy to OpenRouter free models. Rate-limited per IP (10/min, 50/day). See [`worker/README.md`](worker/README.md) for the Cloudflare side.
   - **Anthropic (Claude)** — paid; get a key at [console.anthropic.com](https://console.anthropic.com/) (`sk-ant-...`). Stored in `localStorage` under `ud_anthropic_key`.
   - **Google (Gemini, free tier)** — free up to ~10 RPM / 250 RPD; get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (`AIzaSy...`). Stored under `ud_google_key`.
4. Ask anything — *"show only female moderators"*, *"top 5 countries among admins"*, *"open the card of Ava Taylor"*. Or type `/help` for the slash-command list.

The selected provider is persisted under `ud_provider`. Keys for different providers coexist — switching in the dialog doesn't lose either one. To forget a key: pick its provider in settings → "Forget current key", or `localStorage.removeItem("ud_anthropic_key")` in the console.

### Bundling a default key (optional)

The chat can ship with a pre-filled Gemini key so visitors don't have to bring their own. Open [`app/lib/providers.ts`](app/lib/providers.ts) and paste a key into `DEFAULT_GEMINI_KEY`:

```ts
export const DEFAULT_GEMINI_KEY = "AIzaSy...";  // your Google AI Studio key
```

When this constant is non-empty:
- It becomes the fallback for the Google provider when there's no `localStorage` key.
- The chat settings shows a **default** badge next to the provider name.
- The default provider on first load switches from Anthropic to Google.
- Users can still override by pasting their own key (saved key always wins).

**Security caveat:** the constant is bundled into the public JS, so anyone with browser devtools can read it. Use a **Gemini free-tier key only** — abuse caps out at quota exhaustion, not a bill. The cleaner path is the Demo provider above (key never leaves the server).

### Switching models or adding a provider

- The default model per provider is set in [`app/lib/providers.ts`](app/lib/providers.ts) (`defaultModel`).
- Adding a new provider is a single adapter file (export `runChat` matching the `RunChatParams` / `RunChatResult` types from [`anthropic.ts`](app/lib/anthropic.ts)) plus one entry in the `PROVIDERS` registry. The UI, cost meter, slash commands, Undo cards, and `executeTool` need no changes.
- Tools live in [`app/lib/chatTools.ts`](app/lib/chatTools.ts). Each tool has a zod schema + a local executor that operates on the in-memory `users` array and the dashboard actions exposed through `DashboardCtx`. Adding a new tool is one schema + one switch case in `executeTool`.
- The agent loop lives in each provider adapter (up to 6 tool-use iterations per turn), then returns the final assistant text and aggregated `ChatUsage`.

### Hosting with a real backend

For a public deployment where you want **all** providers (not just Demo) to call through a server, do not ship the browser-direct configuration. Instead:

1. Remove `output: "export"` from `next.config.ts`.
2. Add `app/api/chat/route.ts` handlers per provider, holding the key in `process.env.{ANTHROPIC,GOOGLE}_API_KEY`.
3. Change the fetch URL in each provider adapter to `/api/chat/{provider}`, drop the `x-api-key` and `anthropic-dangerous-direct-browser-access` headers.
4. Deploy to Vercel / a Node host instead of GitHub Pages.

The Cloudflare Worker pattern in `worker/` is essentially this for one provider — copy it and add adapters for the others if you want full server-side routing.
