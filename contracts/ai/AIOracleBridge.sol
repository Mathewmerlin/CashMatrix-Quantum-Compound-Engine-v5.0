// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AIOracleBridge is Ownable {
    address public designatedOracle;
    mapping(bytes32 => uint256) public strategySignals;

    uint256 public constant MAX_COMPOUND_RATE = 1_000_000;

    event SignalReceived(
        bytes32 indexed strategyId,
        uint256 compoundRate,
        uint256 timestamp
    );
    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );

    constructor() Ownable(msg.sender) {
        designatedOracle = msg.sender;
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");

        address oldOracle = designatedOracle;
        designatedOracle = _oracle;

        emit OracleUpdated(oldOracle, _oracle);
    }

    function pushSignal(
        bytes32 strategyId,
        uint256 compoundRate
    ) external {
        require(
            msg.sender == designatedOracle,
            "Only designated AI oracle can push signals"
        );
        require(compoundRate <= MAX_COMPOUND_RATE, "Compound rate too high");

        strategySignals[strategyId] = compoundRate;

        emit SignalReceived(strategyId, compoundRate, block.timestamp);
    }
}
