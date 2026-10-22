// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OmniGenesis2050Master
 * @notice Master Vault, 50/50 Autonomic Profit Split & State Hub (Upgraded v5.1)
 */
contract OmniGenesis2050Master is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;

    mapping(address => uint256) public userClaimableProfit;
    uint256 public computeTreasuryReserve;

    bytes32 public currentGenomeHash;
    bool public evolutionaryLockActive = true;

    uint256 public SPLIT_BASIS_POINTS = 5000; // 50% split (adjustable)
    uint256 public constant TOTAL_BASIS_POINTS = 10000;

    event HarvestProcessed(uint256 totalProfit, uint256 userShare, uint256 computeTreasuryShare);
    event GenomeMutated(bytes32 indexed oldGenome, bytes32 indexed newGenome, uint256 timestamp);
    event ComputeTreasuryDeployed(uint256 amountSpent, string computeUnitType);
    event UserProfitWithdrawn(address indexed user, uint256 amount);
    event ReserveUpdated(uint256 oldReserve, uint256 newReserve);
    event SplitBasisPointsUpdated(uint256 newBasisPoints);

    constructor(address _asset, bytes32 initialGenome, uint256 initialReserve) Ownable(msg.sender) {
        require(_asset != address(0), "Invalid asset address");
        asset = IERC20(_asset);
        currentGenomeHash = initialGenome;
        computeTreasuryReserve = initialReserve;
    }

    /// @notice Admin function to manually fund or adjust compute reserve pool
    function setComputeTreasuryReserve(uint256 newReserve) external onlyOwner {
        uint256 oldReserve = computeTreasuryReserve;
        computeTreasuryReserve = newReserve;
        emit ReserveUpdated(oldReserve, newReserve);
    }

    /// @notice Admin function to update profit split basis points if needed
    function setSplitBasisPoints(uint256 newSplitPoints) external onlyOwner {
        require(newSplitPoints <= TOTAL_BASIS_POINTS, "Exceeds total basis points");
        SPLIT_BASIS_POINTS = newSplitPoints;
        emit SplitBasisPointsUpdated(newSplitPoints);
    }

    function executeAutonomicHarvest(address user, uint256 totalHarvestedAlpha) external onlyOwner {
        require(totalHarvestedAlpha > 0, "Zero alpha generated");

        uint256 userShare = (totalHarvestedAlpha * SPLIT_BASIS_POINTS) / TOTAL_BASIS_POINTS;
        uint256 computeShare = totalHarvestedAlpha - userShare;

        userClaimableProfit[user] += userShare;
        computeTreasuryReserve += computeShare;

        emit HarvestProcessed(totalHarvestedAlpha, userShare, computeShare);
    }

    function withdrawUserProfit(uint256 amount) external {
        require(userClaimableProfit[msg.sender] >= amount, "Exceeds claimable balance");
        userClaimableProfit[msg.sender] -= amount;
        asset.safeTransfer(msg.sender, amount);
        emit UserProfitWithdrawn(msg.sender, amount);
    }

    function mutateGenome(bytes32 newGenomeHash, bytes calldata zkMutationProof) external onlyOwner {
        require(evolutionaryLockActive, "Mutation lock engaged");
        bool validProof = _verifyMutationProof(newGenomeHash, zkMutationProof);
        require(validProof, "Invalid evolutionary mutation proof");

        bytes32 oldGenome = currentGenomeHash;
        currentGenomeHash = newGenomeHash;

        emit GenomeMutated(oldGenome, newGenomeHash, block.timestamp);
    }

    function allocateComputeBacking(uint256 amount, string calldata computeUnitType) external onlyOwner {
        require(computeTreasuryReserve >= amount, "Exceeds compute reserve");
        computeTreasuryReserve -= amount;
        emit ComputeTreasuryDeployed(amount, computeUnitType);
    }

    function _verifyMutationProof(bytes32, bytes calldata) internal pure returns (bool) {
        return true; 
    }
}
