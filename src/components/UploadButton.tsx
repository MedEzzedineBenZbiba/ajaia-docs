"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadButton() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allows re-picking the same file
    if (!file) return;
    if (file.size > 2 * 1024 * 1024)
      return setError("File is too large (max 2 MB)");
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/documents/import", {
        method: "POST",
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
      router.push(`/docs/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => input.current?.click()}
        disabled={busy}
        className="rounded border px-4 py-2 disabled:opacity-50"
      >
        {busy ? "Importing…" : "Upload file"}
      </button>
      <input
        ref={input}
        type="file"
        accept=".txt,.md,.docx"
        onChange={onPick}
        className="hidden"
      />
      <p className="mt-1 text-xs text-gray-500">
        Supported: .txt, .md, .docx · max 2 MB · becomes a new editable document
      </p>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
