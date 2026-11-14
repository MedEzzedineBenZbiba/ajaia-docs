import { NextResponse } from "next/server";
import { getCurrentUser, type User } from "./auth";
import { getDocumentForUser } from "./documents";
import { canShare } from "./access";

// Returns {user} when the caller owns the doc, otherwise a ready-made error response
export async function requireOwner(
  docId: string,
): Promise<{ user: User } | { res: NextResponse }> {
  const user = await getCurrentUser();
  if (!user)
    return {
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const doc = await getDocumentForUser(user.id, docId);
  if (!doc)
    return { res: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (!canShare(doc.role))
    return {
      res: NextResponse.json(
        { error: "Only the owner can manage sharing" },
        { status: 403 },
      ),
    };
  return { user };
}
