/**
 * Insert a notification for a user. Safe to call from any route.
 *
 * If `reference` is provided, the insert is deduped via a unique index —
 * the same reference (e.g. trade id) can only notify once per user.
 */
export async function pushNotification(sql, { userId, type, title, body = null, reference = null }) {
  try {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await sql`
      insert into notifications (id, user_id, type, title, body, reference)
      values (${id}, ${userId}, ${type}, ${title}, ${body}, ${reference})
      on conflict (user_id, reference) do nothing
    `;
    return id;
  } catch {
    return null;
  }
}
