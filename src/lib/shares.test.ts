import { beforeAll, afterAll, describe, it, expect } from "vitest";
import fs from "node:fs";

const DB_FILE = "test-shares.db";
let docs: typeof import("./documents");
let shares: typeof import("./shares");

beforeAll(async () => {
  fs.rmSync(DB_FILE, { force: true });
  process.env.DATABASE_URL = `file:${DB_FILE}`;
  process.env.DATABASE_AUTH_TOKEN = "";
  const { db, SCHEMA } = await import("./db"); // dynamic import so the env var is set first
  for (const s of SCHEMA) await db.execute(s);
  for (const [id, n] of [
    ["u_alice", "Alice"],
    ["u_bob", "Bob"],
    ["u_carol", "Carol"],
  ])
    await db.execute({
      sql: "INSERT INTO users VALUES (?,?,?)",
      args: [id, n, `${n.toLowerCase()}@example.com`],
    });
  docs = await import("./documents");
  shares = await import("./shares");
});
afterAll(() => fs.rmSync(DB_FILE, { force: true }));

describe("sharing end to end", () => {
  it("grant, change role, revoke", async () => {
    const id = await docs.createDocument("u_alice", "Plan");
    expect(await docs.getDocumentForUser("u_bob", id)).toBeNull(); // no access yet

    await shares.upsertShare(id, "u_bob", "viewer");
    expect((await docs.getDocumentForUser("u_bob", id))?.role).toBe("viewer");
    expect((await docs.listDocuments("u_bob")).map((d) => d.id)).toContain(id);

    await shares.upsertShare(id, "u_bob", "editor"); // upsert changes role
    expect((await docs.getDocumentForUser("u_bob", id))?.role).toBe("editor");
    expect(await shares.listShares(id)).toHaveLength(1); // no duplicate row

    expect(await docs.getDocumentForUser("u_carol", id)).toBeNull(); // stranger unaffected

    expect(await shares.removeShare(id, "u_bob")).toBe(1);
    expect(await docs.getDocumentForUser("u_bob", id)).toBeNull(); // revoked
    expect(await shares.removeShare(id, "u_bob")).toBe(0); // idempotent
  });
});
