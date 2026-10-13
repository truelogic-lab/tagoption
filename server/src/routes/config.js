import { WIN_RATE, PAYOUT_MULT, HOUSE_EDGE } from "../lib/settlement.js";

export default async function configRoutes(fastify) {
  fastify.get("/config", async () => ({
    payoutMultiplier: PAYOUT_MULT,
    winRate: WIN_RATE,
    houseEdge: HOUSE_EDGE,
  }));
}
