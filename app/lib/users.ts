import type { SortField, SortOrder, User } from "../types";

export const PAGE_SIZE = 12;

type RawParams = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export interface FilterOptions {
  titles: string[];
  departments: string[];
  locations: string[];
  countries: string[];
  states: string[];
}

export function getFilterOptions(users: User[]): FilterOptions {
  const uniq = (vals: string[]) => [...new Set(vals)].sort();
  return {
    titles: uniq(users.map((u) => u.company.title)),
    departments: uniq(users.map((u) => u.company.department)),
    locations: uniq(users.map((u) => `${u.address.city}, ${u.address.state}`)),
    countries: uniq(users.map((u) => u.address.country)),
    states: uniq(users.map((u) => u.address.state)),
  };
}

export function parseSearchParams(params: RawParams) {
  return {
    q: str(params.q) ?? "",
    gender: str(params.gender) ?? "",
    role: str(params.role) ?? "",
    title: str(params.title) ?? "",
    department: str(params.department) ?? "",
    location: str(params.location) ?? "",
    sortBy: (str(params.sortBy) ?? "firstName") as SortField,
    order: (str(params.order) ?? "asc") as SortOrder,
    page: Math.max(1, parseInt(str(params.page) ?? "1", 10)),
  };
}

export function filterAndSort(
  users: User[],
  q: string,
  gender: string,
  role: string,
  title: string,
  department: string,
  location: string,
  sortBy: SortField,
  order: SortOrder
): User[] {
  let result = users;

  if (q) {
    const lower = q.toLowerCase();
    result = result.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.username.toLowerCase().includes(lower)
    );
  }

  if (gender) result = result.filter((u) => u.gender === gender);
  if (role) result = result.filter((u) => u.role === role);
  if (title) result = result.filter((u) => u.company.title === title);
  if (department) result = result.filter((u) => u.company.department === department);
  if (location) {
    result = result.filter(
      (u) => `${u.address.city}, ${u.address.state}` === location
    );
  }

  result = [...result].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    if (sortBy === "age") {
      aVal = a.age;
      bVal = b.age;
    } else if (sortBy === "lastName") {
      aVal = a.lastName;
      bVal = b.lastName;
    } else {
      aVal = a.firstName;
      bVal = b.firstName;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return order === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  return result;
}

export function paginateUsers(filtered: User[], page: number) {
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return { total, totalPages, safePage, pageUsers };
}
