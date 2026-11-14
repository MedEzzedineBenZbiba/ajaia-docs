"use client";
import { useCallback, useEffect, useState } from "react";

type Share = {
  user_id: string;
  name: string;
  email: string;
  role: "viewer" | "editor";
};

export default function SharePanel({ docId }: { docId: string }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const call = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    if (res.status === 204) return null;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setShares((await call(`/api/documents/${docId}/shares`)).shares);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sharing");
      setShares([]);
    }
  }, [call, docId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function grant(e: string, r: "viewer" | "editor") {
    setBusy(true);
    setError("");
    try {
      const body = await call(`/api/documents/${docId}/shares`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e, role: r }),
      });
      setShares(body.shares);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function revoke(userId: string) {
    if (!confirm("Remove this person's access?")) return;
    setError("");
    try {
      await call(`/api/documents/${docId}/shares/${userId}`, {
        method: "DELETE",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove access");
    }
  }

  return (
    <section className="space-y-3 rounded border p-4" aria-label="Sharing">
      <h2 className="font-semibold">Share this document</h2>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="bob@example.com"
          aria-label="Email to share with"
          className="min-w-0 flex-1 rounded border px-2 py-1"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
          aria-label="Role"
          className="rounded border px-2 py-1"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </select>
        <button
          disabled={busy || !email.trim()}
          onClick={async () => {
            if (await grant(email, role)) setEmail("");
          }}
          className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
        >
          {busy ? "Sharing…" : "Share"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {shares === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : shares.length === 0 ? (
        <p className="text-sm text-gray-500">Not shared with anyone yet.</p>
      ) : (
        <ul className="divide-y rounded border">
          {shares.map((s) => (
            <li
              key={s.user_id}
              className="flex items-center justify-between gap-2 p-2 text-sm"
            >
              <span className="min-w-0 truncate">
                <b>{s.name}</b> <span className="text-gray-500">{s.email}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <select
                  value={s.role}
                  aria-label={`Role for ${s.name}`}
                  onChange={(e) =>
                    void grant(s.email, e.target.value as "viewer" | "editor")
                  }
                  className="rounded border px-1 py-0.5"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={() => void revoke(s.user_id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500">
        Demo users: alice@, bob@, carol@example.com
      </p>
    </section>
  );
}
