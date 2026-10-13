import { http } from "./client";

export const accountApi = {
  updateProfile:  ({ name, email }) => http.patch("/account/profile", { name, email }),
  changePassword: ({ current, next }) => http.post("/account/password", { current, next }),
  verification:   () => http.get("/account/verification"),
  submitKYC:      (payload) => http.post("/account/verification/submit", payload),
  enable2FA:      () => http.post("/account/2fa/enable"),
  disable2FA:     () => http.post("/account/2fa/disable"),
};
