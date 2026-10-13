import { http } from "./client";

export const fxApi = {
  usdKes: () => http.get("/fx/usd-kes"),
};
