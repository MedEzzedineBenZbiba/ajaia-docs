import { db, SCHEMA } from "../src/lib/db";

async function main() {
  for (const sql of SCHEMA) await db.execute(sql);
  const users = [
    ["u_alice", "Alice", "alice@example.com"],
    ["u_bob", "Bob", "bob@example.com"],
    ["u_carol", "Carol", "carol@example.com"],
  ];
  for (const [id, name, email] of users)
    await db.execute({
      sql: "INSERT OR IGNORE INTO users (id,name,email) VALUES (?,?,?)",
      args: [id, name, email],
    });
  console.log("seeded");
}
main();
