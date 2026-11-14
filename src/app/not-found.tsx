import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto mt-24 max-w-sm space-y-3 p-4 text-center">
      <h1 className="text-xl font-semibold">Document not found</h1>
      <p className="text-sm text-gray-600">
        It may not exist, or you may not have access.
      </p>
      <Link href="/" className="underline">
        Back to documents
      </Link>
    </main>
  );
}
