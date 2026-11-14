import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canEdit } from "@/lib/access";
import {
  deleteDocument,
  getDocumentForUser,
  updateDocument,
} from "@/lib/documents";
import { patchSchema, readJson } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };
const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const notFound = () =>
  NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const doc = await getDocumentForUser(user.id, (await params).id);
  return doc ? NextResponse.json({ document: doc }) : notFound();
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const doc = await getDocumentForUser(user.id, id);
  if (!doc) return notFound(); // no access or doesn't exist
  if (!canEdit(doc.role))
    // viewer: exists for them, but can't write
    return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const parsed = patchSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );

  await updateDocument(id, parsed.data);
  const updated = await getDocumentForUser(user.id, id);
  return NextResponse.json({ document: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const doc = await getDocumentForUser(user.id, id);
  if (!doc) return notFound();
  if (doc.role !== "owner")
    return NextResponse.json(
      { error: "Only the owner can delete" },
      { status: 403 },
    );

  await deleteDocument(id);
  return new NextResponse(null, { status: 204 });
}
