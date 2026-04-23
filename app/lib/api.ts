import type { User, UsersResponse } from "../types";

const BASE_URL = "https://dummyjson.com";

export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users?limit=0`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  const data: UsersResponse = await res.json();
  return data.users;
}

export async function getUserById(id: number): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
  return res.json();
}
