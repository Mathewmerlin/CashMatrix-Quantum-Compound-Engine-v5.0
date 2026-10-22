// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OmniGenesis2050Master is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;

    mapping(address => uint256) public userClaimableProfit;
    uint256 public computeTreasuryReserve;

    bytes32 public currentGenomeHash;
    bool public evolutionaryLockActive = true;

    uint256 public splitBasisPoints = 5000;
    uint256 public constant TOTAL_BASIS_POINTS = 10000;
    uint256 public constant MIN_SPLIT_BPS = 1000;
    uint256 public constant MAX_SPLIT_BPS = 9000;

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    event HarvestProcessed(
        uint256 totalProfit,
        uint256 userShare,
        uint256 computeTreasuryShare
    );
    event GenomeMutated(
        bytes32 indexed oldGenome,
        bytes32 indexed newGenome,
        uint256 timestamp
    );
    event ComputeTreasuryDeployed(uint256 amountSpent, string computeUnitType);
    event UserProfitWithdrawn(address indexed user, uint256 amount);
    event ReserveUpdated(uint256 oldReserve, uint256 newReserve);
    event SplitBasisPointsUpdated(uint256 newBasisPoints);

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(
        address _asset,
        bytes32 initialGenome,
        uint256 initialReserve
    ) Ownable(msg.sender) {
        require(_asset != address(0), "Invalid asset address");
        asset = IERC20(_asset);
        currentGenomeHash = initialGenome;
        computeTreasuryReserve = initialReserve;
    }

    function setComputeTreasuryReserve(
        uint256 newReserve
    ) external onlyOwner {
        require(newReserve >= computeTreasuryReserve, "Reserve cannot decrease");
        uint256 oldReserve = computeTreasuryReserve;
        computeTreasuryReserve = newReserve;
        emit ReserveUpdated(oldReserve, newReserve);
    }

    function setSplitBasisPoints(uint256 newSplitPoints) external onlyOwner {
        require(
            newSplitPoints >= MIN_SPLIT_BPS &&
                newSplitPoints <= MAX_SPLIT_BPS,
            "Split out of bounds"
        );
        splitBasisPoints = newSplitPoints;
        emit SplitBasisPointsUpdated(newSplitPoints);
    }

    function executeAutonomicHarvest(
        address user,
        uint256 totalHarvestedAlpha
    ) external onlyOwner {
        require(user != address(0), "Invalid user");
        require(totalHarvestedAlpha > 0, "Zero alpha generated");

        uint256 userShare = (totalHarvestedAlpha * splitBasisPoints) /
            TOTAL_BASIS_POINTS;
        uint256 computeShare = totalHarvestedAlpha - userShare;

        userClaimableProfit[user] += userShare;
        computeTreasuryReserve += computeShare;

        emit HarvestProcessed(totalHarvestedAlpha, userShare, computeShare);
    }

    function withdrawUserProfit(uint256 amount) external nonReentrant {
        uint256 claimable = userClaimableProfit[msg.sender];
        require(claimable >= amount, "Exceeds claimable balance");

        userClaimableProfit[msg.sender] = claimable - amount;

        asset.safeTransfer(msg.sender, amount);

        emit UserProfitWithdrawn(msg.sender, amount);
    }

    function mutateGenome(
        bytes32 newGenomeHash,
        bytes calldata zkMutationProof
    ) external onlyOwner {
        require(!evolutionaryLockActive, "Mutation lock engaged");
        require(newGenomeHash != bytes32(0), "Invalid genome");
        require(zkMutationProof.length > 0, "Missing mutation proof");
        require(_verifyMutationProof(newGenomeHash, zkMutationProof), "Invalid proof");

        bytes32 oldGenome = currentGenomeHash;
        currentGenomeHash = newGenomeHash;

        emit GenomeMutated(oldGenome, newGenomeHash, block.timestamp);
    }

    function allocateComputeBacking(
        uint256 amount,
        string calldata computeUnitType
    ) external onlyOwner {
        require(amount > 0, "Zero allocation");
        require(computeTreasuryReserve >= amount, "Exceeds compute reserve");

        computeTreasuryReserve -= amount;

        emit ComputeTreasuryDeployed(amount, computeUnitType);
    }

    function _verifyMutationProof(
        bytes32,
        bytes calldata
    ) internal pure returns (bool) {
        // TODO: Replace with a real ZK verifier before mainnet.
        // This placeholder must not be treated as cryptographic validation.
        revert("Mutation verifier not implemented");
    }
}
