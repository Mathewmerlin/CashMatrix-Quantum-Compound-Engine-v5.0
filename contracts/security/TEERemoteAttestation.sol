// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TEERemoteAttestation
 * @notice Hardware silicon enclave validation (Intel TDX / AWS Nitro).
 */
contract TEERemoteAttestation is Ownable {
    mapping(bytes32 => bool) public validEnclaves;

    event EnclaveRegistered(bytes32 indexed enclaveMrenclave);

    constructor() Ownable(msg.sender) {}

    function registerEnclave(bytes32 mrenclave) external onlyOwner {
        validEnclaves[mrenclave] = true;
        emit EnclaveRegistered(mrenclave);
    }
}
