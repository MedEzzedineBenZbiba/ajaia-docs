"use client";

export default function LocalTime({ value }: { value: string }) {
  const d = new Date(value.replace(" ", "T") + "Z");
  return (
    <time dateTime={d.toISOString()} suppressHydrationWarning>
      {d.toLocaleString()}
    </time>
  );
}
