import { MARKETS } from "../lib/markets.js";
import { getPrice } from "../lib/marketFeed.js";

export default async function marketRoutes(fastify) {
  // Public — no auth required for the market list
  fastify.get("/markets", async () => {
    return MARKETS.map((m) => ({
      id: m.id,
      name: m.name,
      symbol: m.symbol,
      base: m.base,
      category: m.category,
      active: m.active,
    }));
  });

  fastify.get("/markets/:id/price", async (req, reply) => {
    const p = getPrice(req.params.id);
    if (!p) return reply.code(404).send({ error: "Market not found" });
    return p;
  });
}
