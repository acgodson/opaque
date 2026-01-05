import { DelegationManager } from "generated";

DelegationManager.RedeemedDelegation.handler(async ({ event, context }) => {
  const rootDelegator = event.params.rootDelegator;
  const redeemer = event.params.redeemer;
  
  const transactionHash = (event.transaction as any).hash || event.block.hash;
  const id = `${transactionHash}-${event.logIndex}`;

  const redemptionEntity = {
    id,
    rootDelegator: rootDelegator.toLowerCase(),
    redeemer: redeemer.toLowerCase(),
    delegationHash: undefined, 
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: transactionHash.toLowerCase(),
    logIndex: BigInt(event.logIndex),
  };

  context.Redemption.set(redemptionEntity);
});
