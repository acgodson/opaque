import { createTRPCRouter, baseProcedure } from '../init';
import { adaptersRouter } from './adapters';
import { policiesRouter } from './policies';
import { activityRouter } from './activity';
import { agentRouter } from './agent';

export const appRouter = createTRPCRouter({
  adapters: adaptersRouter,
  policies: policiesRouter,
  activity: activityRouter,
  agent: agentRouter,

  health: baseProcedure.query(async () => {
    return {
      success: true,
      message: 'opaque running',
      timestamp: new Date().toISOString(),
    };
  }),
});

export type AppRouter = typeof appRouter;
