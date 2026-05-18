import { z } from "zod";
import { applyFilters, computeStats, EMPTY_FILTERS, type Filters } from "../hooks/useDashboard";
import type { DashboardCtxValue } from "../components/dashboard-ctx";

// ── schemas ──────────────────────────────────────────────────────────────────

const FiltersSchema = z
  .object({
    role: z.enum(["admin", "moderator", "user"]).optional(),
    gender: z.enum(["male", "female"]).optional(),
    department: z.string().optional(),
    title: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    ageMin: z.number().optional(),
    ageMax: z.number().optional(),
    q: z.string().optional(),
  })
  .strict()
  .optional();

const GroupKeySchema = z.enum(["role", "gender", "department", "country", "title", "state"]);

const StatsInputSchema = z
  .object({
    filters: FiltersSchema,
    groupBy: GroupKeySchema.optional(),
    topN: z.number().int().positive().max(50).default(10),
  })
  .strict();

const QueryInputSchema = z
  .object({
    filters: FiltersSchema,
    fields: z.array(z.string()).optional(),
    limit: z.number().int().positive().max(20).default(10),
    sortBy: z.enum(["firstName", "lastName", "age"]).optional(),
  })
  .strict();

const ApplyInputSchema = z
  .object({
    role: z.enum(["admin", "moderator", "user", ""]).optional(),
    gender: z.enum(["male", "female", ""]).optional(),
    department: z.string().optional(),
    title: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    q: z.string().optional(),
    ageMin: z.number().optional(),
    ageMax: z.number().optional(),
    clearOthers: z.boolean().default(false),
  })
  .strict();

const ClearInputSchema = z.object({}).strict().optional();
const OpenUserSchema = z.object({ id: z.number().int().positive() }).strict();

export type ToolFilters = z.infer<typeof FiltersSchema>;

type GroupKey = z.infer<typeof GroupKeySchema>;

// ── anthropic tool schemas (sent to model) ──────────────────────────────────

const filterPropertiesSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    role: { type: "string", enum: ["admin", "moderator", "user"] },
    gender: { type: "string", enum: ["male", "female"] },
    department: { type: "string" },
    title: { type: "string" },
    country: { type: "string" },
    state: { type: "string" },
    ageMin: { type: "number" },
    ageMax: { type: "number" },
    q: { type: "string", description: "Substring search across first/last name, email, username" },
  },
};

export const ANTHROPIC_TOOLS = [
  {
    name: "get_users_stats",
    description:
      "Compute aggregates over a subset of users (count, by_role, by_gender, by_department, by_country, avg_age, age_buckets, min/max age). Pass filters to narrow the set. Optionally pass groupBy to get a top-N breakdown for one field.",
    input_schema: {
      type: "object",
      properties: {
        filters: filterPropertiesSchema,
        groupBy: {
          type: "string",
          enum: ["role", "gender", "department", "country", "title", "state"],
          description: "Optional — return a top-N breakdown for this field",
        },
        topN: { type: "number", default: 10 },
      },
    },
  },
  {
    name: "query_users",
    description:
      "Return a LIST of users matching the filters. Use this when concrete names/emails are needed. Limit defaults to 10, max 20 — for larger sets ask the user to narrow filters instead.",
    input_schema: {
      type: "object",
      properties: {
        filters: filterPropertiesSchema,
        fields: {
          type: "array",
          items: { type: "string" },
          description: "Which fields to include per user. Default: id, firstName, lastName, age, gender, role, department, title, country.",
        },
        limit: { type: "number", default: 10 },
        sortBy: { type: "string", enum: ["firstName", "lastName", "age"] },
      },
    },
  },
  {
    name: "apply_filters",
    description:
      "Set filters on the dashboard UI (chips in the top bar update, list re-renders). Use when the user asks to 'show only X'. Empty/missing fields are left untouched unless clearOthers is true. Returns matched_count plus a diff describing what changed (used by the UI to show the user what was set).",
    input_schema: {
      type: "object",
      properties: {
        role: { type: "string", enum: ["admin", "moderator", "user", ""] },
        gender: { type: "string", enum: ["male", "female", ""] },
        department: { type: "string" },
        title: { type: "string" },
        country: { type: "string" },
        state: { type: "string" },
        q: { type: "string" },
        ageMin: { type: "number" },
        ageMax: { type: "number" },
        clearOthers: {
          type: "boolean",
          description: "If true, reset all other filters before applying these",
          default: false,
        },
      },
    },
  },
  {
    name: "clear_filters",
    description: "Reset all dashboard filters. Returns the previous state so the UI can offer Undo.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "open_user",
    description: "Open the user-details modal by id. Use after query_users when exactly one user matches and the user asked to see the card.",
    input_schema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
];

// ── rate limiting (sliding window, per browser tab) ─────────────────────────

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_CALLS = 30;
const callTimestamps: number[] = [];

function checkRateLimit(): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  while (callTimestamps.length && callTimestamps[0] < cutoff) callTimestamps.shift();
  if (callTimestamps.length >= RATE_MAX_CALLS) {
    return { ok: false, retryAfterSec: Math.ceil((callTimestamps[0] + RATE_WINDOW_MS - now) / 1000) };
  }
  callTimestamps.push(now);
  return { ok: true };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function toInternalFilters(f: ToolFilters): { filters: Filters; ageFilter: [number, number] | null } {
  const filters: Filters = {
    ...EMPTY_FILTERS,
    q: f?.q ?? "",
    role: f?.role ?? "",
    department: f?.department ?? "",
    title: f?.title ?? "",
    gender: f?.gender ?? "",
    country: f?.country ?? "",
    state: f?.state ?? "",
  };
  let age: [number, number] | null = null;
  if (typeof f?.ageMin === "number" || typeof f?.ageMax === "number") {
    age = [f?.ageMin ?? 0, f?.ageMax ?? 200];
  }
  return { filters, ageFilter: age };
}

function groupValue(u: { role: string; gender: string; company: { department: string; title: string }; address: { country: string; state: string } }, key: GroupKey): string {
  if (key === "department") return u.company.department;
  if (key === "title") return u.company.title;
  if (key === "country") return u.address.country;
  if (key === "state") return u.address.state;
  return key === "role" ? u.role : u.gender;
}

function topN<T extends Parameters<typeof groupValue>[0]>(users: T[], key: GroupKey, n: number): Array<{ value: string; count: number }> {
  const map = new Map<string, number>();
  for (const u of users) {
    const v = groupValue(u, key);
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

function ageBuckets(users: Array<{ age: number }>): Record<string, number> {
  const buckets = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0 };
  for (const u of users) {
    if (u.age <= 25) buckets["18-25"]++;
    else if (u.age <= 35) buckets["26-35"]++;
    else if (u.age <= 45) buckets["36-45"]++;
    else if (u.age <= 55) buckets["46-55"]++;
    else buckets["56+"]++;
  }
  return buckets;
}

function pickFields<U extends { id: number; firstName: string; lastName: string; age: number; gender: string; role: string; email: string; username: string; phone: string; university: string; bloodGroup: string; company: { name: string; department: string; title: string }; address: { country: string; state: string; city: string } }>(u: U, fields: string[]): Record<string, unknown> {
  const flat: Record<string, unknown> = {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    age: u.age,
    gender: u.gender,
    role: u.role,
    email: u.email,
    username: u.username,
    phone: u.phone,
    department: u.company.department,
    title: u.company.title,
    company: u.company.name,
    country: u.address.country,
    state: u.address.state,
    city: u.address.city,
    university: u.university,
    bloodGroup: u.bloodGroup,
  };
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in flat) out[f] = flat[f];
  }
  return out;
}

// ── executor ────────────────────────────────────────────────────────────────

type ToolResult = Record<string, unknown> | { error: string; retry_after_sec?: number };

export async function executeTool(name: string, rawInput: unknown, ctx: DashboardCtxValue): Promise<ToolResult> {
  const limit = checkRateLimit();
  if (!limit.ok) {
    return { error: `Tool rate limit exceeded (${RATE_MAX_CALLS}/min). Retry in ${limit.retryAfterSec}s.`, retry_after_sec: limit.retryAfterSec };
  }

  try {
    switch (name) {
      case "get_users_stats": {
        const input = StatsInputSchema.parse(rawInput ?? {});
        return statsTool(input, ctx);
      }
      case "query_users": {
        const input = QueryInputSchema.parse(rawInput ?? {});
        return queryTool(input, ctx);
      }
      case "apply_filters": {
        const input = ApplyInputSchema.parse(rawInput ?? {});
        return applyFiltersTool(input, ctx);
      }
      case "clear_filters": {
        ClearInputSchema.parse(rawInput);
        return clearTool(ctx);
      }
      case "open_user": {
        const input = OpenUserSchema.parse(rawInput);
        return openUserTool(input, ctx);
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: `Invalid tool input: ${e.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}` };
    }
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

type StatsInput = z.infer<typeof StatsInputSchema>;
type QueryInput = z.infer<typeof QueryInputSchema>;
type ApplyInput = z.infer<typeof ApplyInputSchema>;

function statsTool(input: StatsInput, ctx: DashboardCtxValue): ToolResult {
  const { filters, ageFilter } = toInternalFilters(input.filters);
  const subset = applyFilters(ctx.users, filters, ageFilter);
  const base = computeStats(subset);
  const ages = subset.map((u) => u.age);
  const result: Record<string, unknown> = {
    ...base,
    minAge: ages.length ? Math.min(...ages) : 0,
    maxAge: ages.length ? Math.max(...ages) : 0,
    ageBuckets: ageBuckets(subset),
  };
  if (input.groupBy) {
    result.groupBy = input.groupBy;
    result.top = topN(subset, input.groupBy, input.topN);
  }
  return result;
}

function queryTool(input: QueryInput, ctx: DashboardCtxValue): ToolResult {
  const { filters, ageFilter } = toInternalFilters(input.filters);
  let subset = applyFilters(ctx.users, filters, ageFilter);
  if (input.sortBy === "age") subset = [...subset].sort((a, b) => a.age - b.age);
  else if (input.sortBy === "lastName") subset = [...subset].sort((a, b) => a.lastName.localeCompare(b.lastName));
  else if (input.sortBy === "firstName") subset = [...subset].sort((a, b) => a.firstName.localeCompare(b.firstName));

  const limit = input.limit;
  const fields = input.fields?.length
    ? input.fields
    : ["id", "firstName", "lastName", "age", "gender", "role", "department", "title", "country"];

  return {
    total_matched: subset.length,
    returned: Math.min(subset.length, limit),
    users: subset.slice(0, limit).map((u) => pickFields(u, fields)),
    truncated: subset.length > limit,
  };
}

function snapshotFilters(ctx: DashboardCtxValue) {
  const s = ctx.getCurrentFilters();
  return {
    q: s.q, role: s.role, department: s.department, title: s.title,
    gender: s.gender, country: s.country, state: s.state,
    ageMin: s.ageFilter ? s.ageFilter[0] : null,
    ageMax: s.ageFilter ? s.ageFilter[1] : null,
  };
}

function applyFiltersTool(input: ApplyInput, ctx: DashboardCtxValue): ToolResult {
  const before = snapshotFilters(ctx);
  if (input.clearOthers) ctx.clear();

  const keys: Array<keyof Filters> = ["q", "role", "department", "title", "gender", "country", "state"];
  for (const k of keys) {
    const v = input[k as keyof ApplyInput];
    if (typeof v === "string") ctx.setFilter(k, v);
  }
  if (typeof input.ageMin === "number" || typeof input.ageMax === "number") {
    ctx.onAgeChange([input.ageMin ?? 0, input.ageMax ?? 200]);
  }

  const after = snapshotFilters(ctx);

  // Compute diff: keys whose value changed
  const diff: Record<string, { from: string | number | null; to: string | number | null }> = {};
  (Object.keys(before) as Array<keyof typeof before>).forEach((k) => {
    if (before[k] !== after[k]) diff[k] = { from: before[k], to: after[k] };
  });

  const internal: Filters = {
    q: after.q, role: after.role, department: after.department, title: after.title,
    gender: after.gender, country: after.country, state: after.state,
  };
  const age: [number, number] | null = after.ageMin !== null || after.ageMax !== null
    ? [after.ageMin ?? 0, after.ageMax ?? 200] : null;
  const matched = applyFilters(ctx.users, internal, age);

  return { matched_count: matched.length, previous_filters: before, current_filters: after, diff };
}

function clearTool(ctx: DashboardCtxValue): ToolResult {
  const before = snapshotFilters(ctx);
  ctx.clear();
  return { ok: true, total_users: ctx.users.length, previous_filters: before };
}

function openUserTool(input: z.infer<typeof OpenUserSchema>, ctx: DashboardCtxValue): ToolResult {
  const user = ctx.users.find((u) => u.id === input.id);
  if (!user) return { error: `No user with id ${input.id}` };
  ctx.setSelected(user);
  return { ok: true, opened: { id: user.id, name: `${user.firstName} ${user.lastName}` } };
}
