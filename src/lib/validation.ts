import { z } from "zod";

export const MAX_CONTENT_BYTES = 1_000_000; // ~1 MB of HTML per doc

export const createSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export const patchSchema = z
  .object({
    title: z.string().trim().min(1, "Title can't be empty").max(200).optional(),
    content_html: z.string().max(MAX_CONTENT_BYTES).optional(),
  })
  .strict()
  .refine((v) => v.title !== undefined || v.content_html !== undefined, {
    message: "Nothing to update",
  });

export async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
