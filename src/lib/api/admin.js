import { http } from "./client";

const qs = (params = {}) => {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : "";
};

export const adminApi = {
  /* ---------- Dashboard ---------- */
  overview: () => http.get("/admin/overview"),
  platformMetrics: () => http.get("/admin/platform-metrics"),
  pnl: (days = 14) => http.get(`/admin/pnl${qs({ days })}`),
  metrics: () => http.get("/admin/metrics"),

  /* ---------- Users ---------- */
  users: (params = {}) => http.get(`/admin/users${qs(params)}`),
  user: (id) => http.get(`/admin/users/${id}`),
  adjust: (id, amount, reason) =>
    http.post(`/admin/users/${id}/adjust`, { amount, reason }),
  setWinRate: (id, winRate, reason) =>
    http.post(`/admin/users/${id}/win-rate`, { winRate, reason }),
  setBanned: (id, banned, reason) =>
    http.post(`/admin/users/${id}/ban`, { banned, reason }),
  manualDeposit: (id, amount, reason) =>
    http.post(`/admin/users/${id}/deposit`, { amount, reason }),

  /* ---------- Trades ---------- */
  trades: (params = {}) => http.get(`/admin/trades${qs(params)}`),
  forceSettle: (id, result) =>
    http.post(`/admin/trades/${id}/settle`, { result }),

  /* ---------- Transactions ---------- */
  transactions: (params = {}) => http.get(`/admin/transactions${qs(params)}`),
  creditTx: (id) => http.post(`/admin/transactions/${id}/credit`, {}),
  approveWithdraw: (id, providerRef) =>
    http.post(`/admin/transactions/${id}/approve-withdraw`, { providerRef }),

  /* ---------- Withdrawals ---------- */
  withdrawals: (params = {}) => http.get(`/admin/withdrawals${qs(params)}`),
  reviewWithdrawal: (id, decision, reason) =>
    http.post(`/admin/withdrawals/${id}/review`, { decision, reason }),

  /* ---------- Markets ---------- */
  markets: () => http.get("/admin/markets"),
  toggleMarket: (id, enabled) =>
    http.post(`/admin/markets/${id}/toggle`, { enabled }),
  editMarket: (id, payload) => http.patch(`/admin/markets/${id}`, payload),

  /* ---------- Config ---------- */
  config: () => http.get("/admin/config"),
  setConfig: (payload) => http.post("/admin/config", payload),

  /* ---------- Search / audit ---------- */
  search: (q) => http.get(`/admin/search${qs({ q })}`),
  audit: () => http.get("/admin/audit"),
};
