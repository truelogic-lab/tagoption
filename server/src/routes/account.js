import { z } from "zod";
import { sql } from "../db/index.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";

const profile = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
});

const password = z.object({
  current: z.string().min(6),
  next: z.string().min(6),
});

export default async function accountRoutes(fastify) {
  fastify.addHook("preHandler", fastify.requireAuth);

  // Update name + email
  fastify.patch("/account/profile", async (req, reply) => {
    const parse = profile.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { name, email } = parse.data;

    // Email must be unique across users
    const clash = await sql`
      select id from users where email = ${email} and id <> ${req.userId}
    `;
    if (clash.length) return reply.code(409).send({ error: "Email already in use" });

    await sql`
      update users set name = ${name}, email = ${email} where id = ${req.userId}
    `;
    return { ok: true, user: { id: req.userId, name, email } };
  });

  // Change password
  fastify.post("/account/password", async (req, reply) => {
    const parse = password.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { current, next } = parse.data;

    const rows = await sql`select password_hash from users where id = ${req.userId}`;
    if (!rows.length) return reply.code(404).send({ error: "User not found" });

    const ok = await verifyPassword(current, rows[0].password_hash);
    if (!ok) return reply.code(401).send({ error: "Current password is incorrect" });

    const hash = await hashPassword(next);
    await sql`update users set password_hash = ${hash} where id = ${req.userId}`;

    return { ok: true };
  });

  // Verification status (placeholder — actual KYC to come)
  fastify.get("/account/verification", async (req) => {
    const rows = await sql`select verified from users where id = ${req.userId}`;
    return { verified: Boolean(rows[0]?.verified) };
  });

  fastify.post("/account/verification/submit", async (req) => {
    // Stub — flip to pending review
    return { status: "pending" };
  });

  // Enable / disable 2FA (stub)
  fastify.post("/account/2fa/enable", async () => ({ ok: true, enabled: true }));
  fastify.post("/account/2fa/disable", async () => ({ ok: true, enabled: false }));
}
