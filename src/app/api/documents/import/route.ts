import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createDocument } from "@/lib/documents";
import { MAX_CONTENT_BYTES } from "@/lib/validation";
import {
  ImportError,
  MAX_UPLOAD_BYTES,
  fileToHtml,
  titleFromFilename,
} from "@/lib/import";

export const runtime = "nodejs"; // mammoth needs Node APIs

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Unauthorized", 401);

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return fail("Expected a multipart file upload", 400);
  }

  if (!(file instanceof File)) return fail("No file provided", 400);
  if (file.size === 0) return fail("The file is empty", 400);
  if (file.size > MAX_UPLOAD_BYTES)
    return fail("File is too large (max 2 MB)", 413);

  try {
    const html = await fileToHtml(
      file.name,
      Buffer.from(await file.arrayBuffer()),
    );
    if (!html.trim()) return fail("No readable text found in this file", 400);
    if (html.length > MAX_CONTENT_BYTES)
      return fail("Converted document is too large", 413);
    const id = await createDocument(
      user.id,
      titleFromFilename(file.name),
      html,
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    if (e instanceof ImportError) return fail(e.message, 400);
    console.error("import failed", e);
    return fail("Import failed", 500);
  }
}
