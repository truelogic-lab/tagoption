import { http } from "./client";

export const notificationsApi = {
  list:         () => http.get("/notifications"),
  unreadCount:  () => http.get("/notifications/unread-count"),
  markRead:     (id) => http.post(`/notifications/${id}/read`),
  markAllRead:  () => http.post("/notifications/read-all"),
  clear:        () => http.del("/notifications"),
};
