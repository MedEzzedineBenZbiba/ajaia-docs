import { requireUser } from "@/lib/auth";

export default async function Home() {
  const user = await requireUser();
  return (
    <main className="mx-auto mt-24 max-w-xl space-y-4 p-4">
      <p>
        Signed in as <b>{user.name}</b> ({user.email})
      </p>
      <form action="/api/logout" method="post">
        <button className="rounded border px-3 py-1">Log out</button>
      </form>
    </main>
  );
}
