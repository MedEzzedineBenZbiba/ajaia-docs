import { db } from "./db";

export type ShareRow = {
  user_id: string;
  name: string;
  email: string;
  role: "viewer" | "editor";
};

export async function listShares(docId: string): Promise<ShareRow[]> {
  const r = await db.execute({
    sql: `SELECT s.user_id, s.role, u.name, u.email
          FROM shares s JOIN users u ON u.id = s.user_id
          WHERE s.document_id = ? ORDER BY u.name`,
    args: [docId],
  });
  return r.rows.map((x) => ({
    user_id: String(x.user_id),
    name: String(x.name),
    email: String(x.email),
    role: String(x.role) as ShareRow["role"],
  }));
}

export async function findUserByEmail(email: string) {
  const r = await db.execute({
    sql: "SELECT id, name, email FROM users WHERE email = ?",
    args: [email],
  });
  const row = r.rows[0];
  return row
    ? { id: String(row.id), name: String(row.name), email: String(row.email) }
    : null;
}

// Granting again with a different role simply changes the role
export async function upsertShare(
  docId: string,
  userId: string,
  role: "viewer" | "editor",
) {
  await db.execute({
    sql: `INSERT INTO shares (document_id, user_id, role) VALUES (?,?,?)
          ON CONFLICT(document_id, user_id) DO UPDATE SET role = excluded.role`,
    args: [docId, userId, role],
  });
}

export async function removeShare(
  docId: string,
  userId: string,
): Promise<number> {
  const r = await db.execute({
    sql: "DELETE FROM shares WHERE document_id = ? AND user_id = ?",
    args: [docId, userId],
  });
  return r.rowsAffected;
}
