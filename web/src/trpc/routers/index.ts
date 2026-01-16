import { createTRPCRouter, baseProcedure } from '../init';
import { adaptersRouter } from './adapters';
import { activityRouter } from './activity';
import { agentRouter } from './agent';
import { verificationRouter } from './verification';

export const appRouter = createTRPCRouter({
  adapters: adaptersRouter,
  activity: activityRouter,
  agent: agentRouter,
  verification: verificationRouter,

  health: baseProcedure.query(async () => {
    return {
      success: true,
      message: 'opaque running',
      timestamp: new Date().toISOString(),
    };
  }),
});

export type AppRouter = typeof appRouter;
