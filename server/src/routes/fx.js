import { getUsdKesRate } from "../lib/fx/index.js";

export default async function fxRoutes(fastify) {
  // Public — no auth required
  fastify.get("/fx/usd-kes", async () => {
    const { rate, source, fetchedAt } = await getUsdKesRate();
    return {
      pair: "USD/KES",
      rate,
      source,
      fetchedAt: new Date(fetchedAt || Date.now()).toISOString(),
    };
  });
}
