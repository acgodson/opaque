import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import {
  fetchAllSignals,
  getSignal,
} from "@opaque/agent";

export const signalsRouter = createTRPCRouter({
  // Fetch all signals (async, no DB)
  fetchAll: baseProcedure.query(async () => {
    try {
      const signals = await fetchAllSignals();
      return { signals };
    } catch (error) {
      console.error("[ERROR] Failed to fetch signals:", error);
      throw error;
    }
  }),

  // Fetch specific signal by name
  fetchByName: baseProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      try {
        const signal = getSignal(input.name);
        if (!signal) {
          throw new Error("Signal not found");
        }

        const data = await signal.fetch();
        return { signal: data };
      } catch (error) {
        console.error(`[ERROR] Failed to fetch signal ${input.name}:`, error);
        throw error;
      }
    }),
});
