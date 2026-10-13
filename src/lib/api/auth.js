import { http } from "./client";

export const authApi = {
  login:  ({ email, password }) => http.post("/auth/login", { email, password }),
  signup: ({ name, email, password }) => http.post("/auth/signup", { name, email, password }),
  me:     () => http.get("/auth/me"),
  logout: () => http.post("/auth/logout"),
};
