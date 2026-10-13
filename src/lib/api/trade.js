import { http } from "./client";

export const tradeApi = {
  markets:  () => http.get("/markets"),
  price:    (marketId) => http.get(`/markets/${marketId}/price`),
  place:    (payload) => http.post("/trades", payload),
  settle:   (id, result) => http.post(`/trades/${id}/settle`, { result }),
  open:     () => http.get("/trades?status=open"),
  closed:   () => http.get("/trades?status=closed"),
  history:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http.get(`/trades/history${qs ? `?${qs}` : ""}`);
  },

  autoStart:  (payload) => http.post("/trades/auto/start", payload),
  autoStop:   () => http.post("/trades/auto/stop"),
  autoStatus: () => http.get("/trades/auto/status"),
};
