import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sql } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const file = join(__dirname, "schema.sql");
  const text = await readFile(file, "utf8");
  console.log("Running migration:", file);
  await sql.unsafe(text);
  console.log("Migration complete.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
