import { http } from "./client";

export const walletApi = {
  balance:   () => http.get("/wallet/balance"),
  deposit:   ({ amount, method }) => http.post("/wallet/deposit", { amount, method }),
  withdraw:  ({ amount, method }) => http.post("/wallet/withdraw", { amount, method }),
  history:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http.get(`/wallet/history${qs ? `?${qs}` : ""}`);
  },
};
