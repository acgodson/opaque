import assert from "assert";
import { TestHelpers } from "generated";
import type { Redemption } from "generated";
const { MockDb, DelegationManager, Addresses } = TestHelpers;

describe("DelegationManager template tests", () => {
  it("A RedeemedDelegation event creates a Redemption entity", async () => {
    // Initializing the mock database
    const mockDbInitial = MockDb.createMockDb();

    // Initializing values for mock event
    const rootDelegator = Addresses.defaultAddress;
    const redeemer = Addresses.mockAddresses[0] || Addresses.defaultAddress;

    // Creating a mock event
    const mockRedeemedDelegationEvent =
      DelegationManager.RedeemedDelegation.createMockEvent({
        rootDelegator: rootDelegator,
        redeemer: redeemer,
      });

    // Processing the mock event on the mock database
    const updatedMockDb =
      await DelegationManager.RedeemedDelegation.processEvent({
        event: mockRedeemedDelegationEvent,
        mockDb: mockDbInitial,
      });

    // Calculate the expected ID (transaction hash + log index)
    const transactionHash = (mockRedeemedDelegationEvent.transaction as any).hash || mockRedeemedDelegationEvent.block.hash;
    const expectedId = `${transactionHash}-${mockRedeemedDelegationEvent.logIndex}`;

    // Expected entity that should be created
    const expectedRedemptionEntity: Redemption = {
      id: expectedId,
      rootDelegator: rootDelegator.toLowerCase(),
      redeemer: redeemer.toLowerCase(),
      delegationHash: undefined,
      blockNumber: BigInt(mockRedeemedDelegationEvent.block.number),
      blockTimestamp: BigInt(mockRedeemedDelegationEvent.block.timestamp),
      transactionHash: transactionHash.toLowerCase(),
      logIndex: BigInt(mockRedeemedDelegationEvent.logIndex),
    };

    // Getting the entity from the mock database using the correct ID
    const actualRedemptionEntity =
      updatedMockDb.entities.Redemption.get(expectedId);

    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(expectedRedemptionEntity, actualRedemptionEntity);
  });

  it("2 RedeemedDelegation events from the same rootDelegator updates the redeemer", async () => {
    // Initializing the mock database
    const mockDbInitial = MockDb.createMockDb();
    // Initializing values for mock event
    const rootDelegator = Addresses.defaultAddress;
    const redeemer1 = Addresses.mockAddresses[0] || Addresses.defaultAddress;
    const redeemer2 = Addresses.mockAddresses[1] || Addresses.defaultAddress;

    // Creating a mock event
    const mockRedeemedDelegationEvent1 =
      DelegationManager.RedeemedDelegation.createMockEvent({
        rootDelegator: rootDelegator,
        redeemer: redeemer1,
      });

    // Creating a mock event
    const mockRedeemedDelegationEvent2 =
      DelegationManager.RedeemedDelegation.createMockEvent({
        rootDelegator: rootDelegator,
        redeemer: redeemer2,
      });

    // Processing the mock event on the mock database
    const updatedMockDb =
      await DelegationManager.RedeemedDelegation.processEvent({
        event: mockRedeemedDelegationEvent1,
        mockDb: mockDbInitial,
      });

    // Processing the mock event on the updated mock database
    const updatedMockDb2 =
      await DelegationManager.RedeemedDelegation.processEvent({
        event: mockRedeemedDelegationEvent2,
        mockDb: updatedMockDb,
      });

    // Calculate the ID for the second event
    const transactionHash2 = (mockRedeemedDelegationEvent2.transaction as any).hash || mockRedeemedDelegationEvent2.block.hash;
    const expectedId2 = `${transactionHash2}-${mockRedeemedDelegationEvent2.logIndex}`;

    // Getting the entity from the mock database
    const actualRedemptionEntity =
      updatedMockDb2.entities.Redemption.get(expectedId2);

    // Asserting that the redeemer field is updated to the second redeemer
    assert.equal(redeemer2.toLowerCase(), actualRedemptionEntity?.redeemer);
  });

  it("2 RedeemedDelegation events from the same rootDelegator updates the rootDelegator field correctly", async () => {
    // Initializing the mock database
    const mockDbInitial = MockDb.createMockDb();
    // Initializing values for mock event
    const rootDelegator = Addresses.defaultAddress;
    const redeemer1 = Addresses.mockAddresses[0] || Addresses.defaultAddress;
    const redeemer2 = Addresses.mockAddresses[1] || Addresses.defaultAddress;

    // Creating a mock event
    const mockRedeemedDelegationEvent1 =
      DelegationManager.RedeemedDelegation.createMockEvent({
        rootDelegator: rootDelegator,
        redeemer: redeemer1,
      });

    // Creating a mock event
    const mockRedeemedDelegationEvent2 =
      DelegationManager.RedeemedDelegation.createMockEvent({
        rootDelegator: rootDelegator,
        redeemer: redeemer2,
      });

    // Processing the mock event on the mock database
    const updatedMockDb =
      await DelegationManager.RedeemedDelegation.processEvent({
        event: mockRedeemedDelegationEvent1,
        mockDb: mockDbInitial,
      });

    // Processing the mock event on the updated mock database
    const updatedMockDb2 =
      await DelegationManager.RedeemedDelegation.processEvent({
        event: mockRedeemedDelegationEvent2,
        mockDb: updatedMockDb,
      });

    // Calculate the ID for the second event
    const transactionHash2 = (mockRedeemedDelegationEvent2.transaction as any).hash || mockRedeemedDelegationEvent2.block.hash;
    const expectedId2 = `${transactionHash2}-${mockRedeemedDelegationEvent2.logIndex}`;

    // Getting the entity from the mock database
    const actualRedemptionEntity =
      updatedMockDb2.entities.Redemption.get(expectedId2);

    const expectedRootDelegator: string = rootDelegator.toLowerCase();

    // Asserting that the rootDelegator field value is correct
    assert.equal(expectedRootDelegator, actualRedemptionEntity?.rootDelegator);
  });
});
