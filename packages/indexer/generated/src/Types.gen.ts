/* TypeScript file generated from Types.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {HandlerContext as $$handlerContext} from './Types.ts';

import type {HandlerWithOptions as $$fnWithEventConfig} from './bindings/OpaqueTypes.ts';

import type {Redemption_t as Entities_Redemption_t} from '../src/db/Entities.gen';

import type {SingleOrMultiple as $$SingleOrMultiple_t} from './bindings/OpaqueTypes';

import type {eventOptions as Internal_eventOptions} from 'envio/src/Internal.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericEvent as Internal_genericEvent} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {logger as Envio_logger} from 'envio/src/Envio.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

export type id = string;
export type Id = id;

export type contractRegistrations = { readonly log: Envio_logger; readonly addDelegationManager: (_1:Address_t) => void };

export type entityHandlerContext<entity,indexedFieldOperations> = {
  readonly get: (_1:id) => Promise<(undefined | entity)>; 
  readonly getOrThrow: (_1:id, message:(undefined | string)) => Promise<entity>; 
  readonly getWhere: indexedFieldOperations; 
  readonly getOrCreate: (_1:entity) => Promise<entity>; 
  readonly set: (_1:entity) => void; 
  readonly deleteUnsafe: (_1:id) => void
};

export type handlerContext = $$handlerContext;

export type redemption = Entities_Redemption_t;
export type Redemption = redemption;

export type Transaction_t = {};

export type Block_t = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type AggregatedBlock_t = {
  readonly hash: string; 
  readonly number: number; 
  readonly timestamp: number
};

export type AggregatedTransaction_t = { readonly hash: string };

export type eventLog<params> = Internal_genericEvent<params,Block_t,Transaction_t>;
export type EventLog<params> = eventLog<params>;

export type SingleOrMultiple_t<a> = $$SingleOrMultiple_t<a>;

export type HandlerTypes_args<eventArgs,context> = { readonly event: eventLog<eventArgs>; readonly context: context };

export type HandlerTypes_contractRegisterArgs<eventArgs> = Internal_genericContractRegisterArgs<eventLog<eventArgs>,contractRegistrations>;

export type HandlerTypes_contractRegister<eventArgs> = Internal_genericContractRegister<HandlerTypes_contractRegisterArgs<eventArgs>>;

export type HandlerTypes_eventConfig<eventFilters> = Internal_eventOptions<eventFilters>;

export type fnWithEventConfig<fn,eventConfig> = $$fnWithEventConfig<fn,eventConfig>;

export type contractRegisterWithOptions<eventArgs,eventFilters> = fnWithEventConfig<HandlerTypes_contractRegister<eventArgs>,HandlerTypes_eventConfig<eventFilters>>;

export type DelegationManager_chainId = 11155111;

export type DelegationManager_RedeemedDelegation_eventArgs = {
  readonly rootDelegator: Address_t; 
  readonly redeemer: Address_t; 
  readonly delegation: [Address_t, Address_t, string, Array<[Address_t, string, string]>, bigint, string]
};

export type DelegationManager_RedeemedDelegation_block = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type DelegationManager_RedeemedDelegation_transaction = { readonly hash: string };

export type DelegationManager_RedeemedDelegation_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: DelegationManager_RedeemedDelegation_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: DelegationManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: DelegationManager_RedeemedDelegation_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: DelegationManager_RedeemedDelegation_block
};

export type DelegationManager_RedeemedDelegation_handlerArgs = Internal_genericHandlerArgs<DelegationManager_RedeemedDelegation_event,handlerContext,void>;

export type DelegationManager_RedeemedDelegation_handler = Internal_genericHandler<DelegationManager_RedeemedDelegation_handlerArgs>;

export type DelegationManager_RedeemedDelegation_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<DelegationManager_RedeemedDelegation_event,contractRegistrations>>;

export type DelegationManager_RedeemedDelegation_eventFilter = { readonly rootDelegator?: SingleOrMultiple_t<Address_t>; readonly redeemer?: SingleOrMultiple_t<Address_t> };

export type DelegationManager_RedeemedDelegation_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: DelegationManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type DelegationManager_RedeemedDelegation_eventFiltersDefinition = 
    DelegationManager_RedeemedDelegation_eventFilter
  | DelegationManager_RedeemedDelegation_eventFilter[];

export type DelegationManager_RedeemedDelegation_eventFilters = 
    DelegationManager_RedeemedDelegation_eventFilter
  | DelegationManager_RedeemedDelegation_eventFilter[]
  | ((_1:DelegationManager_RedeemedDelegation_eventFiltersArgs) => DelegationManager_RedeemedDelegation_eventFiltersDefinition);

export type chainId = number;

export type chain = 11155111;
