import { describe, it, expect } from "vitest";
import {
  fileToHtml,
  sanitize,
  textToHtml,
  titleFromFilename,
  ImportError,
} from "../src/lib/import";

describe("import", () => {
  it("txt: escapes HTML and splits paragraphs", () => {
    expect(textToHtml("a <b>\nline2\n\nsecond")).toBe(
      "<p>a &lt;b&gt;<br>line2</p><p>second</p>",
    );
  });
  it("md: converts headings and lists", async () => {
    const html = await fileToHtml("n.md", Buffer.from("# Hi\n\n- a\n- b"));
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).toContain("<li>a</li>");
  });
  it("sanitize strips scripts, handlers and javascript: links", () => {
    const out = sanitize(
      `<p onclick="x()">ok</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">l</a>`,
    );
    expect(out).not.toMatch(/script|onclick|onerror|img|javascript:/i);
    expect(out).toContain("ok");
  });
  it("md with raw HTML is sanitized", async () => {
    const html = await fileToHtml(
      "x.md",
      Buffer.from("hello <script>alert(1)</script>"),
    );
    expect(html).not.toContain("<script");
  });
  it("h5 maps to h3", () => expect(sanitize("<h5>t</h5>")).toBe("<h3>t</h3>"));
  it("rejects unsupported and fake files", async () => {
    await expect(fileToHtml("a.pdf", Buffer.from("x"))).rejects.toBeInstanceOf(
      ImportError,
    );
    await expect(
      fileToHtml("a.docx", Buffer.from("not a zip")),
    ).rejects.toBeInstanceOf(ImportError);
    await expect(
      fileToHtml("a.txt", Buffer.from([65, 0, 66])),
    ).rejects.toBeInstanceOf(ImportError);
  });
  it("title from filename", () => {
    expect(titleFromFilename("Q3 plan.final.md")).toBe("Q3 plan.final");
    expect(titleFromFilename(".md")).toBe("Imported document");
  });
});
