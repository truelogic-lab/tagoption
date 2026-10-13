import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

export const sql = postgres(url, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  transform: { undefined: null },
});
