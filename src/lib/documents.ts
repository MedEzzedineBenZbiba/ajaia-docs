import { db } from "./db";
import { getAccess, type Role } from "./access";

export type DocSummary = {
  id: string;
  title: string;
  owner_id: string;
  owner_name: string;
  role: Role;
  updated_at: string;
};
export type DocFull = DocSummary & { content_html: string; created_at: string };

const str = (v: unknown) => String(v ?? "");

// All docs the user owns or that were shared with them (no content, keeps the list light)
export async function listDocuments(userId: string): Promise<DocSummary[]> {
  const r = await db.execute({
    sql: `SELECT d.id, d.title, d.owner_id, d.updated_at, u.name AS owner_name, s.role AS share_role
          FROM documents d
          JOIN users u ON u.id = d.owner_id
          LEFT JOIN shares s ON s.document_id = d.id AND s.user_id = ?
          WHERE d.owner_id = ? OR s.user_id = ?
          ORDER BY d.updated_at DESC`,
    args: [userId, userId, userId],
  });
  return r.rows.map((row) => ({
    id: str(row.id),
    title: str(row.title),
    owner_id: str(row.owner_id),
    owner_name: str(row.owner_name),
    updated_at: str(row.updated_at),
    role: getAccess(
      userId,
      { owner_id: str(row.owner_id) },
      row.share_role
        ? { role: str(row.share_role) as "viewer" | "editor" }
        : null,
    )!,
  }));
}

// Returns null both when the doc doesn't exist and when the user has no access (route -> 404)
export async function getDocumentForUser(
  userId: string,
  id: string,
): Promise<DocFull | null> {
  const r = await db.execute({
    sql: `SELECT d.*, u.name AS owner_name, s.role AS share_role
          FROM documents d
          JOIN users u ON u.id = d.owner_id
          LEFT JOIN shares s ON s.document_id = d.id AND s.user_id = ?
          WHERE d.id = ?`,
    args: [userId, id],
  });
  const row = r.rows[0];
  if (!row) return null;
  const role = getAccess(
    userId,
    { owner_id: str(row.owner_id) },
    row.share_role
      ? { role: str(row.share_role) as "viewer" | "editor" }
      : null,
  );
  if (!role) return null;
  return {
    id: str(row.id),
    title: str(row.title),
    owner_id: str(row.owner_id),
    owner_name: str(row.owner_name),
    content_html: str(row.content_html),
    created_at: str(row.created_at),
    updated_at: str(row.updated_at),
    role,
  };
}

export async function createDocument(
  ownerId: string,
  title: string,
  contentHtml = "",
) {
  const id = crypto.randomUUID();
  await db.execute({
    sql: "INSERT INTO documents (id, owner_id, title, content_html) VALUES (?,?,?,?)",
    args: [id, ownerId, title, contentHtml],
  });
  return id;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; content_html?: string },
) {
  const sets: string[] = [];
  const args: string[] = [];
  if (patch.title !== undefined) {
    sets.push("title = ?");
    args.push(patch.title);
  }
  if (patch.content_html !== undefined) {
    sets.push("content_html = ?");
    args.push(patch.content_html);
  }
  if (!sets.length) return;
  await db.execute({
    sql: `UPDATE documents SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = ?`,
    args: [...args, id],
  });
}

export async function deleteDocument(id: string) {
  await db.batch(
    [
      { sql: "DELETE FROM shares WHERE document_id = ?", args: [id] }, // don't rely on FK cascade being on
      { sql: "DELETE FROM documents WHERE id = ?", args: [id] },
    ],
    "write",
  );
}
