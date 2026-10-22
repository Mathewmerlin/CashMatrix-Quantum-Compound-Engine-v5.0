// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIOracleBridge
 * @notice Bridges off-chain AI strategy signals and automated compound calculations to the protocol.
 */
contract AIOracleBridge is Ownable {
    address public designatedOracle;
    mapping(bytes32 => uint256) public strategySignals;

    event SignalReceived(bytes32 indexed strategyId, uint256 compoundRate, uint256 timestamp);
    event OracleUpdated(address indexed newOracle);

    constructor() Ownable(msg.sender) {
        designatedOracle = msg.sender;
    }

    function setOracle(address _oracle) external onlyOwner {
        designatedOracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function pushSignal(bytes32 strategyId, uint256 compoundRate) external {
        require(msg.sender == designatedOracle, "Only designated AI oracle can push signals");
        strategySignals[strategyId] = compoundRate;
        emit SignalReceived(strategyId, compoundRate, block.timestamp);
    }
}
