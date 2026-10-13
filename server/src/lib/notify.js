/**
 * Insert a notification for a user. Safe to call from any route.
 * Non-fatal — if the insert fails, the caller continues.
 */
export async function pushNotification(sql, { userId, type, title, body = null }) {
  try {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await sql`
      insert into notifications (id, user_id, type, title, body)
      values (${id}, ${userId}, ${type}, ${title}, ${body})
    `;
    return id;
  } catch {
    return null;
  }
}
