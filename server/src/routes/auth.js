import { z } from "zod";
import { sql } from "../db/index.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signup = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function authRoutes(fastify) {
  fastify.post("/auth/signup", async (req, reply) => {
    const parse = signup.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { name, email, password } = parse.data;

    const existing = await sql`select id from users where email = ${email}`;
    if (existing.length) return reply.code(409).send({ error: "Email already registered" });

    const id = newId("u");
    const hash = await hashPassword(password);

    await sql.begin(async (tx) => {
      await tx`insert into users (id, email, name, password_hash) values (${id}, ${email}, ${name}, ${hash})`;
      await tx`insert into balances (user_id) values (${id})`;
    });

    const token = signToken({ userId: id });
    return { token, user: { id, name, email } };
  });

  fastify.post("/auth/login", async (req, reply) => {
    const parse = credentials.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { email, password } = parse.data;

    const rows = await sql`select id, name, email, password_hash from users where email = ${email}`;
    if (!rows.length) return reply.code(401).send({ error: "Invalid email or password" });
    const user = rows[0];

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return reply.code(401).send({ error: "Invalid email or password" });

    const token = signToken({ userId: user.id });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  });

  fastify.get("/auth/me", { preHandler: fastify.requireAuth }, async (req) => {
    const rows = await sql`select id, name, email, verified from users where id = ${req.userId}`;
    return rows[0] ?? null;
  });
}
