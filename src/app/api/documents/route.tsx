import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createDocument, listDocuments } from "@/lib/documents";
import { createSchema, readJson } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ documents: await listDocuments(user.id) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse((await readJson(req)) ?? {});
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );

  const id = await createDocument(
    user.id,
    parsed.data.title ?? "Untitled document",
  );
  return NextResponse.json({ id }, { status: 201 });
}
