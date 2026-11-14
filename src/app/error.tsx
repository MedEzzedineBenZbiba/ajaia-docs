"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto mt-24 max-w-sm space-y-3 p-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <button onClick={reset} className="rounded border px-3 py-1">
        Try again
      </button>
    </main>
  );
}
