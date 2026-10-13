import { sql } from "../db/index.js";

export default async function notificationRoutes(fastify) {
  fastify.addHook("preHandler", fastify.requireAuth);

  // List notifications
  fastify.get("/notifications", async (req) => {
    const rows = await sql`
      select id, type, title, body, read, at
      from notifications
      where user_id = ${req.userId}
      order by at desc
      limit 100
    `;
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      read: r.read,
      at: r.at,
    }));
  });

  // Unread count (lightweight poll)
  fastify.get("/notifications/unread-count", async (req) => {
    const rows = await sql`
      select count(*)::int as count
      from notifications
      where user_id = ${req.userId} and read = false
    `;
    return { count: rows[0]?.count ?? 0 };
  });

  // Mark one as read
  fastify.post("/notifications/:id/read", async (req) => {
    await sql`
      update notifications set read = true
      where id = ${req.params.id} and user_id = ${req.userId}
    `;
    return { ok: true };
  });

  // Mark all as read
  fastify.post("/notifications/read-all", async (req) => {
    await sql`
      update notifications set read = true
      where user_id = ${req.userId} and read = false
    `;
    return { ok: true };
  });

  // Clear all
  fastify.delete("/notifications", async (req) => {
    await sql`delete from notifications where user_id = ${req.userId}`;
    return { ok: true };
  });
}
