import { http } from "./client";

const qs = (params = {}) => {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : "";
};

export const adminApi = {
  overview: () => http.get("/admin/overview"),

  users: (params = {}) => http.get(`/admin/users${qs(params)}`),
  user: (id) => http.get(`/admin/users/${id}`),
  adjust: (id, amount, reason) =>
    http.post(`/admin/users/${id}/adjust`, { amount, reason }),
  setWinRate: (id, winRate, reason) =>
    http.post(`/admin/users/${id}/win-rate`, { winRate, reason }),

  trades: (params = {}) => http.get(`/admin/trades${qs(params)}`),
  forceSettle: (id, result) =>
    http.post(`/admin/trades/${id}/settle`, { result }),

  transactions: (params = {}) => http.get(`/admin/transactions${qs(params)}`),
  creditTx: (id) => http.post(`/admin/transactions/${id}/credit`, {}),
  approveWithdraw: (id, providerRef) =>
    http.post(`/admin/transactions/${id}/approve-withdraw`, { providerRef }),

  pnl: (days = 14) => http.get(`/admin/pnl${qs({ days })}`),
  config: () => http.get("/admin/config"),
  setConfig: (payload) => http.post("/admin/config", payload),
  search: (q) => http.get(`/admin/search${qs({ q })}`),
  audit: () => http.get("/admin/audit"),
};
