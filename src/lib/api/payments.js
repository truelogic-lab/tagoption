import { http } from "./client";

export const paymentsApi = {
  startDeposit: ({ amount, method, phone, email, currency }) =>
    http.post("/payments/deposit", { amount, method, phone, email, currency }),
  status: (orderTrackingId) => http.get(`/payments/status/${orderTrackingId}`),
};
