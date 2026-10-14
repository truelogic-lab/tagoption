import { sql } from "../db/index.js";

/**
 * Must run after requireAuth. Checks the user's role in the DB.
 * Admin list can also be seeded via ADMIN_EMAILS env var — either path
 * grants access.
 */
export async function requireAdmin(req, reply) {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const rows = await sql`
    select id, email, role from users where id = ${req.userId} limit 1
  `;
  if (!rows.length) return reply.code(401).send({ error: "Not authenticated" });

  const u = rows[0];
  const byRole = u.role === "admin";
  const byEmail = adminEmails.includes(String(u.email || "").toLowerCase());

  if (!byRole && !byEmail) return reply.code(403).send({ error: "Admin only" });

  req.adminId = u.id;
}
