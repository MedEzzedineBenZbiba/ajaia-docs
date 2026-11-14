import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/owner";
import { findUserByEmail, listShares, upsertShare } from "@/lib/shares";
import { readJson, shareSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await requireOwner(id);
  if ("res" in g) return g.res;
  return NextResponse.json({ shares: await listShares(id) });
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await requireOwner(id);
  if ("res" in g) return g.res;

  const parsed = shareSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );

  const target = await findUserByEmail(parsed.data.email);
  if (!target)
    return NextResponse.json(
      { error: "No user with that email" },
      { status: 404 },
    );
  if (target.id === g.user.id)
    return NextResponse.json(
      { error: "You already own this document" },
      { status: 400 },
    );

  await upsertShare(id, target.id, parsed.data.role);
  return NextResponse.json({ shares: await listShares(id) });
}
