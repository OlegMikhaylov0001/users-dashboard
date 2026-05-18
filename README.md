# UserBase — Users Dashboard

A responsive admin dashboard for browsing, searching, filtering, and analysing 208 users from the [DummyJSON API](https://dummyjson.com/docs/users). Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

It also ships with a built-in **AI chat assistant** (`claude-sonnet-4-6`) that can answer aggregate questions about the dataset *and* drive the dashboard UI via tool calls — ask "show only female moderators" and the filter chips actually change.

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

A floating action button in the bottom-right corner opens a chat panel ("Ask about these users"). The agent uses Anthropic's `claude-sonnet-4-6` with five tools:

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

### Why the chat assistant calls Anthropic directly from the browser

The dashboard is published as a static export (`output: "export"` in `next.config.ts`) so it can be hosted on GitHub Pages — there is no Node server at runtime, so there is no API route that could hold an Anthropic key.

Two options exist:

1. **Direct browser → `api.anthropic.com` calls** with the `anthropic-dangerous-direct-browser-access: true` header. The user pastes their own API key into the settings dialog; it lives in `localStorage` under `ud_anthropic_key` and never leaves the browser.
2. A Cloudflare Worker / Vercel Edge function as a proxy with the key in `env`.

Option 1 is shipped because it keeps the project a true static site and lets reviewers try the chat with their own key without provisioning a separate service. The settings dialog states "Demo only — your key, your bill" so the trade-off is explicit. For a publicly shared deployment, swap in option 2.

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
│   └── chatTools.ts        # tool schemas + executor (stats/query/apply/clear/open)
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
3. Paste an Anthropic API key (`sk-ant-...`) into the settings dialog. Get one at [console.anthropic.com](https://console.anthropic.com/). The key is stored in `localStorage` under `ud_anthropic_key`.
4. Ask anything — "show only female moderators", "top 5 countries among admins", "open the card of Ava Taylor".

To forget the key: click the gear icon in the chat header → "Forget current key", or run `localStorage.removeItem("ud_anthropic_key")` in the browser console.

### Switching models or expanding tools

- The model is hard-coded in `app/components/ChatWidget.tsx` (`const MODEL = "claude-sonnet-4-6"`).
- Tools live in `app/lib/chatTools.ts`. Each tool has a JSON schema + a local executor that operates on the in-memory `users` array and the dashboard actions exposed through `DashboardCtx`. Adding a new tool is one schema entry + one switch case in `executeTool`.
- The agent loop is in `app/lib/anthropic.ts` — up to 6 tool-use iterations per turn, then it returns the final assistant text.

### Hosting with a real backend

For a publicly shared deployment, do not ship the browser-direct configuration: anyone can read the key from `localStorage` and the dashboard CORS-allows the call. Instead:

1. Remove `output: "export"` from `next.config.ts`.
2. Add an `app/api/chat/route.ts` route handler that proxies to Anthropic with the key from `process.env.ANTHROPIC_API_KEY`.
3. Change the fetch URL in `app/lib/anthropic.ts` from `https://api.anthropic.com/v1/messages` to `/api/chat`, drop the `x-api-key` and `anthropic-dangerous-direct-browser-access` headers.
4. Deploy to Vercel / a Node host instead of GitHub Pages.
