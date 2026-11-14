import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import mammoth from "mammoth";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB, well under Vercel's 4.5 MB body limit
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Allowlist = what the editor can represent. Anything else is dropped before it reaches the DB.
export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "br",
      "blockquote",
      "code",
      "pre",
      "hr",
      "a",
    ],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https", "mailto"], // blocks javascript: links
    transformTags: { h4: "h3", h5: "h3", h6: "h3" }, // editor only has H1-H3
  });
}

export function textToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export class ImportError extends Error {}

export async function fileToHtml(name: string, buf: Buffer): Promise<string> {
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext))
    throw new ImportError("Unsupported file type. Use .txt, .md or .docx");

  if (ext === ".docx") {
    if (buf[0] !== 0x50 || buf[1] !== 0x4b)
      // a .docx is a zip ("PK")
      throw new ImportError("This doesn't look like a valid .docx file");
    try {
      const { value } = await mammoth.convertToHtml({ buffer: buf });
      return sanitize(value); // <img> isn't allowed, so embedded images are dropped
    } catch {
      throw new ImportError("Could not read this .docx file");
    }
  }

  if (buf.includes(0))
    throw new ImportError("This looks like a binary file, not text");
  const text = new TextDecoder("utf-8").decode(buf);
  if (ext === ".md")
    return sanitize(marked.parse(text, { async: false }) as string);
  return textToHtml(text);
}

export function titleFromFilename(name: string): string {
  const t = name
    .replace(/\.[^.]+$/, "")
    .trim()
    .slice(0, 200);
  return t || "Imported document";
}
