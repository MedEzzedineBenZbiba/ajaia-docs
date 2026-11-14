export type Role = "owner" | "editor" | "viewer";

export function getAccess(
  userId: string,
  doc: { owner_id: string },
  share?: { role: "viewer" | "editor" } | null,
): Role | null {
  if (doc.owner_id === userId) return "owner";
  if (share?.role === "editor") return "editor";
  if (share?.role === "viewer") return "viewer";
  return null; // route handlers turn null into a 404, never a 403
}

export const canEdit = (r: Role | null) => r === "owner" || r === "editor";
export const canShare = (r: Role | null) => r === "owner";
