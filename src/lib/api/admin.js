import { http } from "./client";

export const adminApi = {
  overview:     () => http.get("/admin/overview"),
  users:        (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http.get(`/admin/users${qs ? `?${qs}` : ""}`);
  },
  trades:       (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http.get(`/admin/trades${qs ? `?${qs}` : ""}`);
  },
  transactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http.get(`/admin/transactions${qs ? `?${qs}` : ""}`);
  },
  audit:        () => http.get("/admin/audit"),
  markets:      () => http.get("/admin/markets"),
  forceSettle:  (id, result) => http.post(`/admin/trades/${id}/settle`, { result }),
  adjust:       (userId, amount, reason) =>
    http.post(`/admin/users/${userId}/adjust`, { amount, reason }),
};
