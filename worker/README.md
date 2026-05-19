# users-dashboard chat proxy (Cloudflare Worker)

Tiny edge proxy that lets the dashboard chat work for visitors **without** asking them to bring an API key. Forwards requests to OpenRouter using a key that lives only in Cloudflare environment.

## What it does

- Accepts `POST` from the dashboard (CORS-restricted to allowed origins)
- Enforces per-IP rate limits (10 req/min, 50 req/day by default) via Cloudflare KV
- Adds the OpenRouter Bearer token (from `OPENROUTER_KEY` secret) and the hardcoded free model (`meta-llama/llama-3.3-70b-instruct:free` — pick any other `:free` model from [openrouter.ai/models?supported_parameters=tools&max_price=0](https://openrouter.ai/models?supported_parameters=tools&max_price=0))
- Forwards the chat-completion request to `https://openrouter.ai/api/v1/chat/completions`
- Returns the response unchanged (with CORS headers patched in)

The OpenRouter key never enters the dashboard bundle, never enters git, and the rate limit caps the worst-case daily damage at 50 free-tier requests per visitor.

## One-time setup

```bash
# 1. Install + log in
npm install -g wrangler
wrangler login

# 2. Set your Cloudflare account id in wrangler.toml
#    (find at dash.cloudflare.com → Workers & Pages, top-right)

# 3. Create the KV namespace for rate limit counters
cd worker
wrangler kv namespace create RATE_LIMIT_KV
#    → paste the printed id into wrangler.toml under [[kv_namespaces]].id

# 4. Upload your OpenRouter key (never goes into git)
wrangler secret put OPENROUTER_KEY
#    paste sk-or-v1-... at the prompt
```

## Deploy

```bash
wrangler deploy
# → https://users-dashboard-chat.<your-name>.workers.dev
```

Then in the dashboard repo set:

```bash
# .env.local (dev)
NEXT_PUBLIC_DEMO_WORKER_URL=https://users-dashboard-chat.<your-name>.workers.dev/chat
```

…and add the same as a repo variable in GitHub Actions (`Settings → Secrets and variables → Actions → Variables`) so the production build embeds it.

## Local dev

```bash
cd worker
wrangler dev
# → http://localhost:8787
```

In the dashboard's `.env.local`:

```bash
NEXT_PUBLIC_DEMO_WORKER_URL=http://localhost:8787/chat
```

## Operations

- Tail logs: `wrangler tail`
- Reset all rate-limit counters: delete the KV namespace and recreate
- Change the model: edit `DEFAULT_MODEL` in `wrangler.toml`, redeploy
- Change limits: edit `MAX_RPM` / `MAX_RPD` in `wrangler.toml`, redeploy
