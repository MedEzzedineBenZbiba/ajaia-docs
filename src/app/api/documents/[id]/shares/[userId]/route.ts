import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/owner";
import { removeShare } from "@/lib/shares";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, userId } = await params;
  const g = await requireOwner(id);
  if ("res" in g) return g.res;
  const n = await removeShare(id, userId);
  return n
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
