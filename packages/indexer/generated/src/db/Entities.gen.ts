/* TypeScript file generated from Entities.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type id = string;

export type whereOperations<entity,fieldType> = {
  readonly eq: (_1:fieldType) => Promise<entity[]>; 
  readonly gt: (_1:fieldType) => Promise<entity[]>; 
  readonly lt: (_1:fieldType) => Promise<entity[]>
};

export type Redemption_t = {
  readonly blockNumber: bigint; 
  readonly blockTimestamp: bigint; 
  readonly delegationHash: (undefined | string); 
  readonly id: id; 
  readonly logIndex: bigint; 
  readonly redeemer: string; 
  readonly rootDelegator: string; 
  readonly transactionHash: string
};

export type Redemption_indexedFieldOperations = {};
