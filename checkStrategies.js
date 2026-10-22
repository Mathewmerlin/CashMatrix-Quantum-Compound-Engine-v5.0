import { ethers } from "ethers";

const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";
const VAULT_ADDRESS = "0xcFA8E89738D54bE6f0F4Af7d5086a481E965Ac37";

const VAULT_ABI = [
  "function computeTreasuryReserve() external view returns (uint256)",
  "function currentGenomeHash() external view returns (bytes32)",
  "function evolutionaryLockActive() external view returns (bool)",
  "function SPLIT_BASIS_POINTS() external view returns (uint256)",
  "function asset() external view returns (address)"
];

const ERC20_ABI = [
  "function decimals() external view returns (uint8)"
];

async function checkStrategyState() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

  const assetAddress = await vault.asset();
  const tokenContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
  const decimals = await tokenContract.decimals();

  const treasuryReserve = await vault.computeTreasuryReserve();
  const genomeHash = await vault.currentGenomeHash();
  const lockActive = await vault.evolutionaryLockActive();
  const splitPoints = await vault.SPLIT_BASIS_POINTS();

  console.log("--- Quantum-Compound Engine State & Strategies ---");
  console.log(`Compute Treasury Reserve: ${ethers.formatUnits(treasuryReserve, decimals)} USDC equiv`);
  console.log(`Current Genome Hash: ${genomeHash}`);
  console.log(`Evolutionary Lock Active: ${lockActive}`);
  console.log(`Split Basis Points (Protocol/User): ${splitPoints.toString()}`);
}

checkStrategyState().catch(console.error);
