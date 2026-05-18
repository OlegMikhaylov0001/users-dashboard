import type { User } from "../types";
import { applyFilters, computeStats, EMPTY_FILTERS, type Filters } from "../hooks/useDashboard";
import type { DashboardCtxValue } from "../components/dashboard-ctx";

export interface ToolFilters {
  role?: "admin" | "moderator" | "user";
  gender?: "male" | "female";
  department?: string;
  title?: string;
  country?: string;
  state?: string;
  ageMin?: number;
  ageMax?: number;
  q?: string;
}

type GroupKey = "role" | "gender" | "department" | "country" | "title" | "state";

export const ANTHROPIC_TOOLS = [
  {
    name: "get_users_stats",
    description:
      "Compute aggregates over a subset of users (count, by_role, by_gender, by_department, by_country, avg_age, age_buckets, min/max age). Pass filters to narrow the set. Optionally pass groupBy to get a top-N breakdown for one field.",
    input_schema: {
      type: "object",
      properties: {
        filters: {
          type: "object",
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
        },
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
        filters: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["admin", "moderator", "user"] },
            gender: { type: "string", enum: ["male", "female"] },
            department: { type: "string" },
            title: { type: "string" },
            country: { type: "string" },
            state: { type: "string" },
            ageMin: { type: "number" },
            ageMax: { type: "number" },
            q: { type: "string" },
          },
        },
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
      "Set filters on the dashboard UI (chips in the top bar update, list re-renders). Use when the user asks to 'show only X'. Empty/missing fields are left untouched unless clearOthers is true. Returns matched_count.",
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
    description: "Reset all dashboard filters.",
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

function toInternalFilters(f: ToolFilters | undefined): { filters: Filters; ageFilter: [number, number] | null } {
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

function groupValue(u: User, key: GroupKey): string {
  if (key === "department") return u.company.department;
  if (key === "title") return u.company.title;
  if (key === "country") return u.address.country;
  if (key === "state") return u.address.state;
  return u[key];
}

function topN(users: User[], key: GroupKey, n: number): Array<{ value: string; count: number }> {
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

function ageBuckets(users: User[]): Record<string, number> {
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

interface StatsInput {
  filters?: ToolFilters;
  groupBy?: GroupKey;
  topN?: number;
}

interface QueryInput {
  filters?: ToolFilters;
  fields?: string[];
  limit?: number;
  sortBy?: "firstName" | "lastName" | "age";
}

interface ApplyInput extends ToolFilters {
  clearOthers?: boolean;
}

type ToolResult = Record<string, unknown> | { error: string };

export async function executeTool(name: string, input: unknown, ctx: DashboardCtxValue): Promise<ToolResult> {
  try {
    if (name === "get_users_stats") return statsTool(input as StatsInput, ctx);
    if (name === "query_users") return queryTool(input as QueryInput, ctx);
    if (name === "apply_filters") return applyFiltersTool(input as ApplyInput, ctx);
    if (name === "clear_filters") return clearTool(ctx);
    if (name === "open_user") return openUserTool(input as { id: number }, ctx);
    return { error: `Unknown tool: ${name}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function statsTool(input: StatsInput, ctx: DashboardCtxValue): ToolResult {
  const { filters, ageFilter } = toInternalFilters(input?.filters);
  const subset = applyFilters(ctx.users, filters, ageFilter);
  const base = computeStats(subset);
  const ages = subset.map((u) => u.age);
  const result: Record<string, unknown> = {
    ...base,
    minAge: ages.length ? Math.min(...ages) : 0,
    maxAge: ages.length ? Math.max(...ages) : 0,
    ageBuckets: ageBuckets(subset),
  };
  if (input?.groupBy) {
    result.groupBy = input.groupBy;
    result.top = topN(subset, input.groupBy, input.topN ?? 10);
  }
  return result;
}

function pickFields(u: User, fields: string[]): Record<string, unknown> {
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

function queryTool(input: QueryInput, ctx: DashboardCtxValue): ToolResult {
  const { filters, ageFilter } = toInternalFilters(input?.filters);
  let subset = applyFilters(ctx.users, filters, ageFilter);
  if (input?.sortBy === "age") subset = [...subset].sort((a, b) => a.age - b.age);
  else if (input?.sortBy === "lastName") subset = [...subset].sort((a, b) => a.lastName.localeCompare(b.lastName));
  else if (input?.sortBy === "firstName") subset = [...subset].sort((a, b) => a.firstName.localeCompare(b.firstName));

  const limit = Math.min(input?.limit ?? 10, 20);
  const fields = input?.fields?.length
    ? input.fields
    : ["id", "firstName", "lastName", "age", "gender", "role", "department", "title", "country"];

  return {
    total_matched: subset.length,
    returned: Math.min(subset.length, limit),
    users: subset.slice(0, limit).map((u) => pickFields(u, fields)),
    truncated: subset.length > limit,
  };
}

function applyFiltersTool(input: ApplyInput, ctx: DashboardCtxValue): ToolResult {
  if (input?.clearOthers) ctx.clear();

  const keys: Array<keyof Filters> = ["q", "role", "department", "title", "gender", "country", "state"];
  for (const k of keys) {
    const v = input?.[k as keyof ApplyInput];
    if (typeof v === "string") ctx.setFilter(k, v);
  }
  if (typeof input?.ageMin === "number" || typeof input?.ageMax === "number") {
    ctx.onAgeChange([input?.ageMin ?? 0, input?.ageMax ?? 200]);
  }

  const snapshot = ctx.getCurrentFilters();
  const internal: Filters = {
    q: typeof input?.q === "string" ? input.q : snapshot.q,
    role: typeof input?.role === "string" ? input.role : snapshot.role,
    department: typeof input?.department === "string" ? input.department : snapshot.department,
    title: typeof input?.title === "string" ? input.title : snapshot.title,
    gender: typeof input?.gender === "string" ? input.gender : snapshot.gender,
    country: typeof input?.country === "string" ? input.country : snapshot.country,
    state: typeof input?.state === "string" ? input.state : snapshot.state,
  };
  const age: [number, number] | null =
    typeof input?.ageMin === "number" || typeof input?.ageMax === "number"
      ? [input?.ageMin ?? 0, input?.ageMax ?? 200]
      : snapshot.ageFilter;

  const matched = applyFilters(ctx.users, internal, age);
  return { matched_count: matched.length, active_filters: { ...internal, ageFilter: age } };
}

function clearTool(ctx: DashboardCtxValue): ToolResult {
  ctx.clear();
  return { ok: true, total_users: ctx.users.length };
}

function openUserTool(input: { id: number }, ctx: DashboardCtxValue): ToolResult {
  const user = ctx.users.find((u) => u.id === input.id);
  if (!user) return { error: `No user with id ${input.id}` };
  ctx.setSelected(user);
  return { ok: true, opened: { id: user.id, name: `${user.firstName} ${user.lastName}` } };
}
