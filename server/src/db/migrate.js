import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("[migrate] DATABASE_URL not set — skipping");
    return;
  }

  const { sql } = await import("./index.js");
  const file = join(__dirname, "schema.sql");
  const text = await readFile(file, "utf8");

  console.log("Running migration:", file);
  await sql.unsafe(text);
  console.log("Migration complete.");
  await sql.end();
}

main().catch((e) => {
  console.error("[migrate] failed:", e.message);
  process.exit(0);
});
