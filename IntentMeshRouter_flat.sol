// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20 ^0.8.24;

// lib/openzeppelin-contracts/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// lib/openzeppelin-contracts/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// contracts/core/IntentMeshRouter.sol

/**
 * @title IntentMeshRouter
 * @notice Private Intent-Centric Solver Mesh (Bypasses Public Mempool)
 */
contract IntentMeshRouter is Ownable {
    struct Intent {
        address user;
        bytes payload;
        uint256 deadline;
        bool executed;
    }

    mapping(bytes32 => Intent) public intents;
    mapping(address => bool) public authorizedSolvers;

    event IntentSubmitted(bytes32 indexed intentHash, address indexed user, uint256 deadline);
    event IntentExecuted(bytes32 indexed intentHash, address indexed solver);
    event SolverAuthorized(address indexed solver, bool status);

    constructor() Ownable(msg.sender) {}

    function setSolverAuthorization(address solver, bool status) external onlyOwner {
        authorizedSolvers[solver] = status;
        emit SolverAuthorized(solver, status);
    }

    function submitIntent(bytes calldata payload, uint256 deadline) external returns (bytes32 intentHash) {
        require(block.timestamp <= deadline, "Intent deadline expired");
        intentHash = keccak256(abi.encodePacked(msg.sender, payload, deadline, block.chainid));
        require(intents[intentHash].user == address(0), "Intent already exists");

        intents[intentHash] = Intent({
            user: msg.sender,
            payload: payload,
            deadline: deadline,
            executed: false
        });

        emit IntentSubmitted(intentHash, msg.sender, deadline);
    }

    function executeIntent(bytes32 intentHash) external {
        require(authorizedSolvers[msg.sender], "Not an authorized solver");
        Intent storage intent = intents[intentHash];
        require(intent.user != address(0), "Intent does not exist");
        require(!intent.executed, "Intent already executed");
        require(block.timestamp <= intent.deadline, "Intent expired");

        intent.executed = true;
        emit IntentExecuted(intentHash, msg.sender);
    }
}

