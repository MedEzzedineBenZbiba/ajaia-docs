import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic"; // read users at request time, not build time

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  const { rows } = await db.execute(
    "SELECT id, name, email FROM users ORDER BY name",
  );

  return (
    <main className="mx-auto mt-24 max-w-sm space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-gray-600">
        Demo login: pick a seeded user. This is mock auth by design, not secure.
      </p>
      {error && (
        <p className="text-sm text-red-600">
          That user doesn&apos;t exist. Try again.
        </p>
      )}
      {rows.length === 0 && (
        <p className="text-sm text-red-600">
          No users found. Run the seed script.
        </p>
      )}
      {rows.map((u) => (
        <form key={String(u.id)} action="/api/login" method="post">
          <input type="hidden" name="userId" value={String(u.id)} />
          <button className="w-full rounded border px-4 py-3 text-left hover:bg-gray-50">
            <span className="font-medium">{String(u.name)}</span>
            <span className="block text-sm text-gray-500">
              {String(u.email)}
            </span>
          </button>
        </form>
      ))}
    </main>
  );
}
