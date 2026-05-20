import type { User, UsersResponse } from "../types";

const BASE_URL = "https://dummyjson.com";

// In-memory cache for user list to optimize Next.js concurrent build workers
let usersCache: User[] | null = null;
let usersPromise: Promise<User[]> | null = null;

export async function getAllUsers(): Promise<User[]> {
  if (usersCache) {
    return usersCache;
  }
  if (usersPromise) {
    return usersPromise;
  }

  usersPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/users?limit=0`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data: UsersResponse = await res.json();
      usersCache = data.users;
      return data.users;
    } catch (error) {
      usersPromise = null;
      throw error;
    }
  })();

  return usersPromise;
}

export async function getUserById(id: number): Promise<User> {
  // 1. Try to find the user in the active in-memory cache
  if (usersCache) {
    const cachedUser = usersCache.find((u) => u.id === id);
    if (cachedUser) return cachedUser;
  }

  // 2. If a list fetch promise is pending, wait and check
  if (usersPromise) {
    try {
      const list = await usersPromise;
      const cachedUser = list.find((u) => u.id === id);
      if (cachedUser) return cachedUser;
    } catch {
      // Fall through to manual fetch if promise fails
    }
  }

  // 3. Populate cache if it is empty by fetching all users
  try {
    const list = await getAllUsers();
    const cachedUser = list.find((u) => u.id === id);
    if (cachedUser) return cachedUser;
  } catch {
    console.warn(`Local caching population failed. Falling back to single fetch for user ${id}`);
  }

  // 4. Ultimate fallback: direct fetch from dummyjson single user API
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
  return res.json();
}
