import { ethers } from "ethers";

// Configuration Constants
const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";
const VAULT_ADDRESS = "0xcFA8E89738D54bE6f0F4Af7d5086a481E965Ac37";
const KEEPER_ADDRESS = "0xc3531641bF1B5c543fAf2BeBC1f3098b32497CA9";

// Minimal ABIs (ethers v6 syntax compatibility)
const VAULT_ABI = [
  "function asset() external view returns (address)",
  "function computeTreasuryReserve() external view returns (uint256)",
  "function userClaimableProfit(address) external view returns (uint256)"
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

async function checkVaultBalances() {
  // ethers v6 uses JsonRpcProvider directly
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

  // 1. Get underlying asset address
  const assetAddress = await vault.asset();
  console.log(`Underlying Asset Token Address: ${assetAddress}`);

  const tokenContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
  const decimals = await tokenContract.decimals();

  // 2. Fetch Vault Token Balance & Reserves
  const vaultTokenBalance = await tokenContract.balanceOf(VAULT_ADDRESS);
  const treasuryReserve = await vault.computeTreasuryReserve();
  const keeperTokenBalance = await tokenContract.balanceOf(KEEPER_ADDRESS);

  console.log("--- CashMatrix Quantum-Compound Engine Balances (ethers v6) ---");
  console.log(`Vault Token Balance: ${ethers.formatUnits(vaultTokenBalance, decimals)} tokens`);
  console.log(`Compute Treasury Reserve: ${ethers.formatUnits(treasuryReserve, decimals)} USDC equiv`);
  console.log(`Keeper Wallet Token Balance: ${ethers.formatUnits(keeperTokenBalance, decimals)} tokens`);
}

checkVaultBalances().catch(console.error);
