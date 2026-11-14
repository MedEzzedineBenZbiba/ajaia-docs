"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor as TipTap } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
// Tiptap v2 only: import Underline from "@tiptap/extension-underline";

type Role = "owner" | "editor" | "viewer";
type Status = "saved" | "unsaved" | "saving" | "error";
type Patch = { title?: string; content_html?: string };

const LABEL: Record<Status, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes…",
  saving: "Saving…",
  error: "Save failed. Will retry on next edit",
};

function Btn({
  on,
  active,
  children,
  label,
}: {
  on: () => void;
  active?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={on}
      className={`rounded px-2 py-1 text-sm ${active ? "bg-black text-white" : "hover:bg-gray-100"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: TipTap }) {
  const c = () => editor.chain().focus();
  return (
    <div className="flex flex-wrap gap-1 rounded border bg-white p-1">
      <Btn
        label="Bold"
        active={editor.isActive("bold")}
        on={() => c().toggleBold().run()}
      >
        <b>B</b>
      </Btn>
      <Btn
        label="Italic"
        active={editor.isActive("italic")}
        on={() => c().toggleItalic().run()}
      >
        <i>I</i>
      </Btn>
      <Btn
        label="Underline"
        active={editor.isActive("underline")}
        on={() => c().toggleUnderline().run()}
      >
        <u>U</u>
      </Btn>
      <span className="mx-1 w-px bg-gray-200" />
      <Btn
        label="Normal text"
        active={editor.isActive("paragraph")}
        on={() => c().setParagraph().run()}
      >
        Text
      </Btn>
      {([1, 2, 3] as const).map((l) => (
        <Btn
          key={l}
          label={`Heading ${l}`}
          active={editor.isActive("heading", { level: l })}
          on={() => c().toggleHeading({ level: l }).run()}
        >
          H{l}
        </Btn>
      ))}
      <span className="mx-1 w-px bg-gray-200" />
      <Btn
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        on={() => c().toggleBulletList().run()}
      >
        • List
      </Btn>
      <Btn
        label="Numbered list"
        active={editor.isActive("orderedList")}
        on={() => c().toggleOrderedList().run()}
      >
        1. List
      </Btn>
    </div>
  );
}

export default function Editor(props: {
  id: string;
  initialTitle: string;
  initialHtml: string;
  role: Role;
  ownerName: string;
}) {
  const { id, role } = props;
  const readOnly = role === "viewer";
  const [title, setTitle] = useState(props.initialTitle);
  const [status, setStatus] = useState<Status>("saved");
  const [error, setError] = useState("");

  const dirty = useRef<Patch>({});
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGoodTitle = useRef(props.initialTitle);

  const flush = useCallback(async () => {
    if (inFlight.current) return; // the in-flight request re-runs flush when it finishes
    const patch = dirty.current;
    if (!Object.keys(patch).length) return;
    dirty.current = {};
    inFlight.current = true;
    setStatus("saving");
    let ok = false;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        if (res.status === 404)
          throw new Error("You no longer have access to this document");
        if (res.status === 403)
          throw new Error("This document is now read-only for you");
        if (res.status === 401)
          throw new Error("Your session expired. Log in again");
        throw new Error(
          (await res.json().catch(() => ({}))).error ?? `Error ${res.status}`,
        );
      }
      if (patch.title !== undefined) lastGoodTitle.current = patch.title;
      ok = true;
      setError("");
    } catch (e) {
      dirty.current = { ...patch, ...dirty.current }; // keep unsent changes, newer edits win
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      inFlight.current = false;
    }
    if (!ok) return setStatus("error");
    if (Object.keys(dirty.current).length) {
      setStatus("unsaved");
      void flush();
    } else setStatus("saved");
  }, [id]);

  const schedule = useCallback(() => {
    setStatus("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 800);
  }, [flush]);

  const editor = useEditor({
    extensions: [StarterKit /*, Underline (v2 only) */],
    content: props.initialHtml,
    editable: !readOnly,
    immediatelyRender: false, // avoids an SSR hydration mismatch in Next
    shouldRerenderOnTransaction: true, // keeps toolbar active states in sync
    editorProps: {
      attributes: { class: "prose-editor rounded border bg-white p-4" },
    },
    onUpdate: ({ editor }) => {
      if (readOnly) return;
      dirty.current.content_html = editor.getHTML();
      schedule();
    },
  });

  // Best-effort save when the tab closes
  useEffect(() => {
    const onHide = () => {
      if (!Object.keys(dirty.current).length || readOnly) return;
      void fetch(`/api/documents/${id}`, {
        method: "PATCH",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(dirty.current),
      });
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      onHide();
    };
  }, [id, readOnly]);

  function onTitleChange(v: string) {
    setTitle(v);
    const t = v.trim();
    if (!t) return; // never send an empty title
    dirty.current.title = t;
    schedule();
  }
  function onTitleBlur() {
    if (!title.trim()) setTitle(lastGoodTitle.current); // revert an empty title
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          readOnly={readOnly}
          maxLength={200}
          aria-label="Document title"
          className="w-full rounded border border-transparent px-2 py-1 text-2xl font-semibold hover:border-gray-200 focus:border-gray-400 focus:outline-none"
        />
        {!readOnly && (
          <span
            className={`shrink-0 text-sm ${status === "error" ? "text-red-600" : "text-gray-500"}`}
            aria-live="polite"
          >
            {LABEL[status]}
          </span>
        )}
      </div>
      <p className="px-2 text-sm text-gray-500">
        {role === "owner"
          ? "You own this document"
          : `Owned by ${props.ownerName}`}
        {role === "viewer" && " · View only"}
        {role === "editor" && " · You can edit"}
      </p>
      {error && <p className="px-2 text-sm text-red-600">{error}</p>}
      {!readOnly && editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
