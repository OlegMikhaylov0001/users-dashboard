# UserBase — Users Dashboard

A responsive admin dashboard for browsing, searching, filtering, and analysing 208 users from the [DummyJSON API](https://dummyjson.com/docs/users). Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4 — styled in a Linear-inspired design (Manrope + JetBrains Mono, OKLCH color tokens, table-as-default + side panel).

It also ships with a built-in **AI chat assistant** (Anthropic Claude or Google Gemini — switch in settings) that can answer aggregate questions about the dataset *and* drive the dashboard UI via tool calls — ask "show only female moderators" and the filter chips actually change.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build (pre-renders all 208 user detail pages)
npm start       # serve the production build
```

---

## What's inside

### Dashboard (`/`)

The main view is a single-page client dashboard. All 208 users are fetched server-side on first load (ISR, revalidates every 5 min), then every interaction — filtering, sorting, search — happens instantly in memory without a network round-trip.

**Sidebar**
- Brand logo + navigation links
- Quick-filter shortcuts: "Admins", saved department presets (Engineering / HR / Services)
- "Charts" toggle that shows/hides the analytics strip
- On mobile: hidden by default, opens as a slide-in drawer from a hamburger button; closes on backdrop tap or any nav action

**Search & filters**
- Full-text search across name, email, and username
- Primary filter bar: Role · Department · Gender
- Secondary filter bar (collapsible via "+ More filters"): Job title · Age range · Country · State
- Age range uses a **custom dual-thumb slider** built with `useRef` + `window` mouse/touch events — native `<input type="range">` pairs were abandoned because the top input always captured pointer events on the minimum thumb
- Active filters highlighted in blue; "Clear all" resets everything

**Stats row**
- 6 live metrics computed from the filtered set: Total · Admins (%) · Moderators (%) · Avg age · Top department · Gender balance
- On mobile: collapsed to a single summary line (`208 users · Legal · 51F 49M`) with a chevron toggle to expand the full grid — keeps the user list visible without scrolling

**Analytics charts** (toggled from sidebar)
- Role donut chart
- Gender split bar
- Age histogram (6 buckets: 18–25, 26–35, …, 66+)
- Department horizontal bar (top 6)
- All four charts are hand-drawn SVG — no chart library dependency
- Charts update in real time as filters change

**User list**
- Two layouts: card grid and compact list row — toggled from topbar
- Grid: avatar initials with deterministic colour palette, name, email, age, gender, department chip, role badge
- List: same data in a denser table-style row; on mobile the middle columns (title, dept) hide to avoid cramping
- On **desktop**: paginated (8 per page) with smart ellipsis pagination
- On **mobile**: infinite scroll via `IntersectionObserver` — a sentinel `<div>` at list bottom triggers the next batch of 8 when it enters the viewport

**User modal**
- Clicking any card opens a centered overlay modal (not a side panel — side panels feel unexpected when you click a list item)
- Backdrop click or `Escape` closes it
- Shows: contact, age/gender, company, department, city/country
- Footer link → full profile page

### AI chat assistant (`/`, floating widget)

A floating action button in the bottom-right corner opens a chat panel ("Ask about these users"). The agent supports **three providers** (chosen in the settings dialog):

| Provider | Default model | Pricing | When to use |
|---|---|---|---|
| **Demo** (when configured) | `llama-3.3-70b:free` via OpenRouter | Free — shared proxy, ~10 req/min, 50/day per IP | Visitors who don't want to provision a key. Default when set up. |
| Anthropic | `claude-sonnet-4-6` | Paid — your key, your bill | Production-quality answers, complex multi-step reasoning |
| Google | `gemini-2.5-flash` | Free tier (~10 req/min, 250/day) | Dev, demos, smoke-testing without burning tokens |

All three providers route through the same five tools:

| Tool | What it does |
|---|---|
| `get_users_stats` | Counts, averages, age buckets, top-N breakdowns over any filter slice |
| `query_users` | Returns a sample of matching users (up to 20 rows) with selected fields |
| `apply_filters` | **Sets the actual dashboard filter chips** — the list re-renders live |
| `clear_filters` | Resets all dashboard filters |
| `open_user` | Opens the user-details modal by id |

The agent runs in a tool-use loop (up to 6 iterations) so it can chain calls — e.g. "reset filters and open Ava Taylor's card" triggers `clear_filters` → `query_users` → `open_user` in a single turn.

The current dashboard filters are injected into the system prompt before every request, so the model knows what slice is already visible to the user.

Verified examples (run during development):

- *"What's the average age of engineering users in the US?"* → calls `get_users_stats`, replies with the number (33 years, 19 users)
- *"Show only female moderators"* → calls `apply_filters({role:"moderator", gender:"female"})`, chips in the top bar update, list shows 5 users
- *"Reset all filters and open the card of Ava Taylor"* → 3 tool calls in sequence, modal opens

### User detail page (`/users/[id]`)

208 static pages pre-rendered at build time via `generateStaticParams`. Each page shows the complete user record organised in labelled sections: Personal · Contact & Address · Company · Banking · Crypto · System.

PII notes: card number, IBAN, and EIN fields are omitted — they serve no analytical purpose and shouldn't be casually exposed in a dashboard UI.

### Dark mode

Follows the OS `prefers-color-scheme` setting via `window.matchMedia`. A `useDark()` hook feeds a `DarkCtx` React context so both Tailwind dark-mode classes and SVG `fill`/`stroke` colours (which can't use CSS classes) stay in sync.

---

## Architecture decisions

### Why client-side state instead of URL params

The initial prototype stored filters in URL search params, which is ideal for bookmarkability. It was replaced because:

1. DummyJSON doesn't support combining filters server-side. To filter by role AND department AND age, you have to fetch all users and filter in JS anyway.
2. The age slider emits continuous values — debouncing URL writes is doable but adds complexity with no real payoff for a dataset this size.
3. 208 records is ~50 KB JSON. Keeping everything in memory and filtering client-side is instantaneous and doesn't require a server round-trip per interaction.

The trade-off is that filter state is lost on refresh. Acceptable for an internal admin tool where most sessions are fresh.

### Why fetch all users at once

DummyJSON's `/users` endpoint accepts a single `search` or `filter[field]` query — not multiple. To support seven simultaneous filters (role, gender, department, title, country, state, age), you need the full dataset on the client. The `page.tsx` Server Component fetches once with `next: { revalidate: 300 }` and passes the array as a prop.

### Why no chart library

Recharts, Victory, Chart.js — all add ≥ 50 KB to the bundle for four simple charts. The four shapes needed here (arc paths, rectangles, horizontal bars) are straightforward SVG that fits in ~130 lines. Custom SVG also means full control over dark-mode colours, which would otherwise require fighting the library's theming system.

### Why a custom age slider

The standard pattern of two stacked `<input type="range" class="opacity-0">` elements breaks because the upper input always intercepts pointer events over the lower one, making the minimum thumb unreachable. The replacement (`AgeSlider.tsx`) uses two visible `<div>` thumbs, a `useRef` track element, and stable `window` `mousemove`/`touchmove` listeners attached once in `useEffect`. A `state.current` ref avoids stale closures in the event handler.

### Why a modal instead of a side panel

A right-side detail panel that slides out when you click a list item is a common pattern, but it reads as "selection" rather than "detail" — the user clicked something and expected to go somewhere, not have a panel appear beside them. A centred overlay with a backdrop is unambiguous: you opened something, you close it with `Esc` or the backdrop.

### Demo provider — shared OpenRouter proxy via Cloudflare Worker

The demo provider exists so a casual visitor can try the chat without signing up for any LLM service. It routes through a small Cloudflare Worker (~150 lines in `worker/src/index.ts`) that:

```
Browser (GitHub Pages)        Cloudflare Worker             OpenRouter
─────────────────────         ──────────────────            ──────────────
POST /chat               ──→  + Bearer key from env  ──→   :free model
{messages, tools}             + per-IP rate limit          (Gemini Flash,
                              + origin allowlist           Llama 3.3, etc)
                         ←──  + CORS headers          ←──
```

- The OpenRouter key lives **only** in the Worker's environment (`wrangler secret put`). It never enters the dashboard bundle, never enters git.
- Per-IP rate limit (10 req/min, 50/day, both adjustable in `wrangler.toml`) caps abuse at quota exhaustion — not a bill.
- Free OpenRouter model: `meta-llama/llama-3.3-70b-instruct:free` by default (stable, good tool-calling). Swap any `:free` model in `wrangler.toml` — list at [openrouter.ai/models?supported_parameters=tools&max_price=0](https://openrouter.ai/models?supported_parameters=tools&max_price=0).
- On `429`, the chat surfaces an inline "use my Claude/Gemini key" CTA that hot-swaps the provider.

See `worker/README.md` for the full Cloudflare setup (5 commands, ~10 minutes). On the dashboard side, set:

```bash
# .env.local (dev)
NEXT_PUBLIC_DEMO_WORKER_URL=https://users-dashboard-chat.<your-name>.workers.dev/chat
```

…and add the same as a repo variable in GitHub Actions for production builds.

### Why three providers behind one interface

The chat ships with **Anthropic**, **Google**, and an optional **demo** (OpenRouter via Cloudflare Worker) behind a small registry (`app/lib/providers.ts`). The registry exposes a `runChat` function with an identical signature for every provider; the message format, tool schemas, and `ChatUsage` shape are normalised, and each provider's adapter translates to its native wire format (Anthropic Messages API for Claude, `generativelanguage.googleapis.com/v1beta` for Gemini, OpenAI Chat Completions for OpenRouter).

Three reasons for the split:

1. **Dev cost** — Gemini 2.5 Flash is free up to 250 requests/day. Day-to-day testing of new tools, slash commands, and the agent loop no longer burns Anthropic credits.
2. **Portability** — adding GPT-4 / Mistral / DeepSeek in future is a single new adapter file plus one entry in the registry. The UI, cost meter, slash commands, and tool executor are provider-agnostic.
3. **Portfolio signal** — multi-provider thinking with a normalised internal format is a senior pattern (LangChain / Vercel AI SDK do something similar). It also gives a natural foundation for **model routing** (cheap classifier picks the provider per query) in a future PR.

The Anthropic adapter posts JSON to `api.anthropic.com/v1/messages` with `anthropic-dangerous-direct-browser-access: true`. The Gemini adapter posts to `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...`; it also strips JSON Schema keywords Gemini rejects (`additionalProperties`, `$schema`, `default`) and maintains a tool-call-id → name map so cross-provider message history round-trips cleanly.

### Why the chat assistant calls the LLM directly from the browser

The dashboard is published as a static export (`output: "export"` in `next.config.ts`) so it can be hosted on GitHub Pages — there is no Node server at runtime, so there is no API route that could hold an API key.

Two options exist:

1. **Direct browser → provider calls.** The user pastes their own API key into the settings dialog; it lives in `localStorage` (`ud_anthropic_key` / `ud_google_key`) and never leaves the browser.
2. A Cloudflare Worker / Vercel Edge function as a proxy with the key in `env`.

Option 1 is shipped because it keeps the project a true static site and lets reviewers try the chat with their own key without provisioning a separate service. The settings dialog states the cost trade-off per provider so it is explicit. For a publicly shared deployment, swap in option 2.

### Why a React Context for tool execution

Chat tools like `apply_filters` need to mutate the same state that the rest of the dashboard reads from (`useDashboard`). Threading those setters through props from `Dashboard.tsx` → `ChatWidget.tsx` would require lifting actions through every intermediate component. Instead a small `DashboardCtx` exposes only what tools need (`users`, `setFilter`, `applyPreset`, `clear`, `onAgeChange`, `setSelected`, `getCurrentFilters`). The chat widget pulls actions from context; `useDashboard` remains the single source of truth.

### Component structure

```
app/
├── hooks/
│   ├── useDark.ts          # OS dark-mode detection
│   ├── useDashboard.ts     # all dashboard state, filters, pagination, stats
│   └── useIsMobile.ts      # matchMedia < 640px
├── lib/
│   ├── api.ts              # fetch wrapper with ISR cache
│   ├── palette.ts          # deterministic colour palette for avatars/chips
│   ├── users.ts            # getFilterOptions (extract unique depts, countries…)
│   ├── anthropic.ts        # Anthropic Messages API client + tool-use agent loop
│   ├── gemini.ts           # Google Gemini API client + tool-use agent loop
│   ├── openrouter.ts       # OpenAI-format client targeting our Cloudflare Worker (demo)
│   ├── providers.ts        # registry — selects runChat impl + pricing per provider id
│   ├── pricing.ts          # per-provider token pricing tables + cost helpers
│   └── chatTools.ts        # tool schemas (zod) + executor (stats/query/apply/clear/open)
├── components/
│   ├── Dashboard.tsx       # layout shell — wires hooks to child components
│   ├── Sidebar.tsx         # nav drawer
│   ├── StatsCards.tsx      # 6-metric strip, collapsible on mobile
│   ├── Charts.tsx          # RoleDonut, AgeHistogram, DeptBar, GenderBreakdown
│   ├── ChatWidget.tsx      # floating chat panel (FAB + settings + message list)
│   ├── dashboard-ctx.ts    # React context exposing dashboard actions to chat tools
│   ├── dark-ctx.ts         # React context for isDark flag
│   ├── ui/
│   │   ├── FilterChip.tsx  # dropdown chip with search
│   │   ├── AgeSlider.tsx   # dual-thumb range + AgeRangeChip wrapper
│   │   ├── Pagination.tsx  # smart ellipsis pagination
│   │   ├── RoleBadge.tsx   # coloured role pill
│   │   └── DeptChip.tsx    # palette-coloured department tag
│   └── users/
│       ├── UserCard.tsx    # grid card
│       ├── UserRow.tsx     # list row (responsive columns)
│       └── UserModal.tsx   # centred overlay with user summary
└── users/[id]/
    └── page.tsx            # static detail page (208 pages pre-rendered)
```

`Dashboard.tsx` is intentionally thin — it wires `useDashboard()` to child components and owns the sidebar-open toggle. Logic lives in hooks, UI lives in components, constants live in `lib/`.

### Mobile

| Concern | Desktop | Mobile |
|---|---|---|
| Sidebar | Always visible (220 px) | Slide-in drawer, starts below topbar |
| Stats | 6-col grid | Collapsed summary line, expands on tap |
| Charts | 4-col strip | 1 → 2 → 4 col responsive grid |
| User list | 2-col card grid | 1-col cards |
| User rows | 3-col (name + title + dept) | Name + email only |
| Navigation | Pagination | Infinite scroll via `IntersectionObserver` |

---

## Stack

| | |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Data | [DummyJSON](https://dummyjson.com) — no account needed |
| Charts | Hand-written SVG |
| Extra dependencies | None |

---

## Using the chat assistant

1. `npm run dev`, open `http://localhost:3000`.
2. Click the blue chat button in the bottom-right corner.
3. In the settings dialog pick a provider:
   - **Demo (no key — free tier)** — shows up only when `NEXT_PUBLIC_DEMO_WORKER_URL` is configured. Uses the project's Cloudflare Worker proxy to OpenRouter free models. Rate-limited per IP (10/min, 50/day). See `worker/README.md` for the Cloudflare side.
   - **Anthropic (Claude)** — paid; get a key at [console.anthropic.com](https://console.anthropic.com/) (`sk-ant-...`). Stored in `localStorage` under `ud_anthropic_key`.
   - **Google (Gemini, free tier)** — free up to ~10 RPM / 250 RPD; get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (`AIzaSy...`). Stored under `ud_google_key`.
4. Ask anything — "show only female moderators", "top 5 countries among admins", "open the card of Ava Taylor".

The selected provider is persisted under `ud_provider`. Both keys can coexist — switching providers in the dialog doesn't lose either one. To forget a key: pick its provider, click gear → "Forget current key", or run `localStorage.removeItem("ud_anthropic_key")` / `removeItem("ud_google_key")` in the console.

### Bundling a default key (optional)

The chat can ship with a pre-filled key so visitors don't have to bring their own. Open `app/lib/providers.ts` and paste a key into `DEFAULT_GEMINI_KEY`:

```ts
export const DEFAULT_GEMINI_KEY = "AIzaSy...";  // your Google AI Studio key
```

When this constant is non-empty:
- It becomes the fallback for the Google provider when there's no `localStorage` key.
- The chat header shows a **default** badge next to the provider name.
- The default provider on first load switches from Anthropic to Google.
- Users can still override by pasting their own key in settings (saved key always wins).

**Security caveat:** the constant is bundled into the public JS, so anyone with browser devtools can read it. Use a **Gemini free-tier key only** — abuse caps out at quota exhaustion (250 req/day, 10 req/min), not a bill. `DEFAULT_ANTHROPIC_KEY` exists for symmetry but **don't use it** unless you accept that scrapers can burn your credit budget.

### Switching models or adding a provider

- The default model per provider is set in `app/lib/providers.ts` (`defaultModel`).
- Adding a new provider is a single adapter file (export `runChat` matching the `RunChatParams` / `RunChatResult` types from `anthropic.ts`) + one entry in the `PROVIDERS` registry. The UI, cost meter, slash commands, and `executeTool` need no changes.
- Tools live in `app/lib/chatTools.ts`. Each tool has a zod schema + a local executor that operates on the in-memory `users` array and the dashboard actions exposed through `DashboardCtx`. Adding a new tool is one schema + one switch case in `executeTool`.
- The agent loop lives in `app/lib/anthropic.ts` (and `gemini.ts`) — up to 6 tool-use iterations per turn, then it returns the final assistant text and aggregated `ChatUsage`.

### Hosting with a real backend

For a publicly shared deployment, do not ship the browser-direct configuration: anyone can read the key from `localStorage` and the dashboard CORS-allows the call. Instead:

1. Remove `output: "export"` from `next.config.ts`.
2. Add an `app/api/chat/route.ts` route handler that proxies to Anthropic with the key from `process.env.ANTHROPIC_API_KEY`.
3. Change the fetch URL in `app/lib/anthropic.ts` from `https://api.anthropic.com/v1/messages` to `/api/chat`, drop the `x-api-key` and `anthropic-dangerous-direct-browser-access` headers.
4. Deploy to Vercel / a Node host instead of GitHub Pages.
