import { verifyToken } from "../lib/auth.js";

export async function requireAuth(req, reply) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return reply.code(401).send({ error: "Not authenticated" });

  const payload = verifyToken(token);
  if (!payload?.sub) return reply.code(401).send({ error: "Invalid token" });

  req.userId = payload.sub;
}
