"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewDocButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ??
            "Could not create document",
        );
      const { id } = await res.json();
      router.push(`/docs/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={create}
        disabled={busy}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "+ New document"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
