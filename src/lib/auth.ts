import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const COOKIE = "uid";
export type User = { id: string; name: string; email: string };

export async function getUserById(id: string): Promise<User | null> {
  const r = await db.execute({
    sql: "SELECT id, name, email FROM users WHERE id = ?",
    args: [id],
  });
  const row = r.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
  };
}

// Re-verifies the cookie against the DB on every call (never trust the cookie value alone)
export async function getCurrentUser(): Promise<User | null> {
  const uid = (await cookies()).get(COOKIE)?.value;
  return uid ? getUserById(uid) : null;
}

// For pages: redirects to /login. For API routes use getCurrentUser() and return 401.
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
