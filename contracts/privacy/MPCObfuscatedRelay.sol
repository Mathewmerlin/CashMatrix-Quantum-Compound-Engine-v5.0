// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MPCObfuscatedRelay
 * @notice Manages MPC-encrypted payloads and relay verification for zero-knowledge privacy.
 */
contract MPCObfuscatedRelay is Ownable {
    mapping(bytes32 => bool) public processedPayloads;
    mapping(address => bool) public authorizedRelayers;

    event PayloadRelayed(bytes32 indexed payloadHash, address indexed relayNode);
    event RelayerAuthorizationUpdated(address indexed relayer, bool status);

    constructor() Ownable(msg.sender) {}

    function setRelayerAuthorization(address relayer, bool status) external onlyOwner {
        authorizedRelayers[relayer] = status;
        emit RelayerAuthorizationUpdated(relayer, status);
    }

    function relayPayload(bytes calldata encryptedData, bytes32 payloadHash) external {
        require(authorizedRelayers[msg.sender], "Not an authorized relayer");
        require(!processedPayloads[payloadHash], "Payload already processed");

        processedPayloads[payloadHash] = true;
        emit PayloadRelayed(payloadHash, msg.sender);
    }
}
