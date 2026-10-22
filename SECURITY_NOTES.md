# Security Notes

## Accepted lint warnings

### block.timestamp
`block.timestamp` is used for intent deadlines, timelock windows, and keeper intervals.
These are coarse timing controls and are not relied upon for precise sequencing.

### KeeperBot event ordering
`CompoundTriggered` is emitted after `compoundYield()` because the harvested-yield
value is returned by that external call. `performUpkeep` is protected by
`nonReentrant`, role-based access control, and an interval check.

### OmniGenesis2050Master unreachable code
`_verifyMutationProof()` intentionally reverts until a real ZK verifier is integrated.
This prevents genome mutation from succeeding with an unimplemented proof system.

## Mainnet requirements

Before mainnet deployment:

- Replace the ZK mutation-proof placeholder with a real verifier.
- Transfer contract ownership to a timelock or multisig.
- Independently review all owner-only and keeper functions.
- Deploy fresh contracts; never reuse testnet deployments.
- Verify all deployed contracts on Sourcify with `exact_match`.
- Approve only narrowly scoped, audited intent targets.
- Start with minimal capital and monitor initial operations.
