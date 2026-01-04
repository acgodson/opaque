import { createTRPCRouter, baseProcedure } from '../init';
import { sessionRouter } from './session';
import { executeRouter } from './execute';
import { adaptersRouter } from './adapters';
import { permissionsRouter } from './permissions';
import { policiesRouter } from './policies';
import { signalsRouter } from './signals';
import { activityRouter } from './activity';
import { envioRouter } from './envio';

export const appRouter = createTRPCRouter({
  session: sessionRouter,
  execute: executeRouter,
  adapters: adaptersRouter,
  permissions: permissionsRouter,
  policies: policiesRouter,
  signals: signalsRouter,
  activity: activityRouter,
  envio: envioRouter,

  health: baseProcedure.query(async () => {
    return {
      success: true,
      message: '0xVisor running',
      timestamp: new Date().toISOString(),
    };
  }),
});

export type AppRouter = typeof appRouter;
