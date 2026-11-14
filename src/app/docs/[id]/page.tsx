import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDocumentForUser } from "@/lib/documents";
import Editor from "@/components/Editor";
import SharePanel from "@/components/SharePanel";

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const doc = await getDocumentForUser(user.id, id);
  if (!doc) notFound(); // same response for "missing" and "no access"

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <Link href="/" className="text-sm text-gray-600 hover:underline">
        ← All documents
      </Link>
      <Editor
        id={doc.id}
        initialTitle={doc.title}
        initialHtml={doc.content_html}
        role={doc.role}
        ownerName={doc.owner_name}
      />
      {doc.role === "owner" && <SharePanel docId={doc.id} />}
    </main>
  );
}
