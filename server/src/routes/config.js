import { getConfig } from "../lib/settlement.js";

export default async function configRoutes(fastify) {
  fastify.get("/config", async () => {
    const { winRate, payoutMult } = getConfig();
    const edge = (1 - winRate) * 1 - winRate * payoutMult;
    return {
      payoutMultiplier: payoutMult,
      winRate,
      houseEdge: edge,
    };
  });
}
