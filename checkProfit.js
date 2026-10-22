import { ethers } from "ethers";

const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";
const VAULT_ADDRESS = "0xcFA8E89738D54bE6f0F4Af7d5086a481E965Ac37";
const USER_ADDRESS = "0xc3531641bF1B5c543fAf2BeBC1f3098b32497CA9"; // Replace with target user address if different

const VAULT_ABI = [
  "function userClaimableProfit(address) external view returns (uint256)",
  "function asset() external view returns (address)"
];

const ERC20_ABI = [
  "function decimals() external view returns (uint8)"
];

async function checkProfit() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

  const assetAddress = await vault.asset();
  const tokenContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
  const decimals = await tokenContract.decimals();

  const claimableProfit = await vault.userClaimableProfit(USER_ADDRESS);

  console.log("--- User Profit Telemetry ---");
  console.log(`Target User: ${USER_ADDRESS}`);
  console.log(`Claimable Profit: ${ethers.formatUnits(claimableProfit, decimals)} USDC equiv`);
}

checkProfit().catch(console.error);
