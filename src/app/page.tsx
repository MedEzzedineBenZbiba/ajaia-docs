import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDocuments, type DocSummary } from "@/lib/documents";
import NewDocButton from "@/components/NewDocButton";
import LocalTime from "@/components/LocalTime";
import UploadButton from "@/components/UploadButton";

function Section({
  title,
  docs,
  empty,
}: {
  title: string;
  docs: DocSummary[];
  empty: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {docs.length === 0 ? (
        <p className="rounded border border-dashed p-4 text-sm text-gray-500">
          {empty}
        </p>
      ) : (
        <ul className="divide-y rounded border">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/docs/${d.id}`}
                className="flex items-center justify-between gap-4 p-3 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.title}</p>
                  <p className="text-xs text-gray-500">
                    {d.role === "owner"
                      ? "Owned by you"
                      : `Shared by ${d.owner_name}`}{" "}
                    · updated <LocalTime value={d.updated_at} />
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    d.role === "owner"
                      ? "bg-green-100 text-green-800"
                      : d.role === "editor"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {d.role === "owner"
                    ? "Owner"
                    : d.role === "editor"
                      ? "Shared · Editor"
                      : "Shared · Viewer"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function Dashboard() {
  const user = await requireUser();
  const docs = await listDocuments(user.id);
  const owned = docs.filter((d) => d.role === "owner");
  const shared = docs.filter((d) => d.role !== "owner");

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>
            Signed in as <b>{user.name}</b>
          </span>
          <form action="/api/logout" method="post">
            <button className="rounded border px-3 py-1">Log out</button>
          </form>
        </div>
      </header>
      <div className="flex flex-wrap items-start gap-4">
        <NewDocButton />
        <UploadButton />
      </div>
      <Section
        title="Owned by me"
        docs={owned}
        empty="No documents yet. Create one above or import a file."
      />
      <Section
        title="Shared with me"
        docs={shared}
        empty="Nothing has been shared with you yet."
      />
    </main>
  );
}
