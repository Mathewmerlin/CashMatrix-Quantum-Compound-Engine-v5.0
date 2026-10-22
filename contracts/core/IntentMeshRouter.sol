// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IntentMeshRouter is Ownable {
    struct Intent {
        address user;
        address target;
        bytes payload;
        uint256 deadline;
        bool executed;
    }

    mapping(bytes32 => Intent) public intents;
    mapping(address => bool) public authorizedSolvers;
    mapping(address => bool) public approvedTargets;

    uint256 public constant MAX_PAYLOAD_BYTES = 2048;

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    event IntentSubmitted(
        bytes32 indexed intentHash,
        address indexed user,
        address indexed target,
        uint256 deadline
    );
    event IntentExecuted(bytes32 indexed intentHash, address indexed solver);
    event SolverAuthorized(address indexed solver, bool status);
    event TargetApproved(address indexed target, bool status);

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor() Ownable(msg.sender) {}

    function setSolverAuthorization(address solver, bool status) external onlyOwner {
        authorizedSolvers[solver] = status;
        emit SolverAuthorized(solver, status);
    }

    function setApprovedTarget(address target, bool status) external onlyOwner {
        require(target != address(0), "Invalid target");
        approvedTargets[target] = status;
        emit TargetApproved(target, status);
    }

    function submitIntent(
        address target,
        bytes calldata payload,
        uint256 deadline
    ) external returns (bytes32 intentHash) {
        require(block.timestamp <= deadline, "Intent deadline expired");
        require(payload.length <= MAX_PAYLOAD_BYTES, "Payload too large");
        require(approvedTargets[target], "Target not approved");

        intentHash = keccak256(
            abi.encodePacked(msg.sender, target, payload, deadline, block.chainid)
        );
        require(intents[intentHash].user == address(0), "Intent already exists");

        intents[intentHash] = Intent({
            user: msg.sender,
            target: target,
            payload: payload,
            deadline: deadline,
            executed: false
        });

        emit IntentSubmitted(intentHash, msg.sender, target, deadline);
    }

    function executeIntent(bytes32 intentHash) external nonReentrant {
        require(authorizedSolvers[msg.sender], "Not authorized solver");

        Intent storage intent = intents[intentHash];
        require(intent.user != address(0), "Intent does not exist");
        require(!intent.executed, "Intent already executed");
        require(block.timestamp <= intent.deadline, "Intent expired");
        require(approvedTargets[intent.target], "Target not approved");

        intent.executed = true;

        (bool success, ) = intent.target.call(intent.payload);
        require(success, "Payload execution failed");

        emit IntentExecuted(intentHash, msg.sender);
    }
}
