import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallet.js";
import tradeRoutes from "./routes/trades.js";
import notificationRoutes from "./routes/notifications.js";
import accountRoutes from "./routes/account.js";
import marketRoutes from "./routes/markets.js";
import { requireAuth } from "./middleware/auth.js";
import { startTicker, stopTicker } from "./lib/marketFeed.js";

dotenv.config();

let transport;
if (process.env.NODE_ENV !== "production") {
  try {
    await import("pino-pretty");
    transport = { target: "pino-pretty" };
  } catch {
    transport = undefined;
  }
}

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL || "info", transport },
});

await app.register(helmet);
await app.register(cors, {
  origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
  credentials: true,
});
await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });

app.decorate("requireAuth", requireAuth);

app.get("/health", async () => ({ ok: true, ts: Date.now() }));

await app.register(marketRoutes);
await app.register(authRoutes);
await app.register(walletRoutes);
await app.register(tradeRoutes);
await app.register(notificationRoutes);
await app.register(accountRoutes);

// Start the simulated tick feed
startTicker();

// Clean up on shutdown
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    stopTicker();
    await app.close();
    process.exit(0);
  });
}

const port = Number(process.env.PORT || 3001);
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`TagOption API listening on :${port}`);
} catch (e) {
  app.log.error(e);
  process.exit(1);
}
