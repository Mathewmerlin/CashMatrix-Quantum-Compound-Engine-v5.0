#!/usr/bin/env node
import { ethers } from 'ethers';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, 'keeper', '.env');
if (fs.existsSync(envPath)) {
  const dotenv = await import('dotenv');
  dotenv.default.config({ path: envPath });
}

const VAULT_ADDRESS = '0xeD862497CBb436dCAAE77FEba005c43d5f9448eb';
const ASSET_ADDRESS = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'; // Wrapped BNB on testnet

const VAULT_ABI = [
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function previewDeposit(uint256) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

interface DepositConfig {
  rpcUrl: string;
  privateKey: string;
  amount: string;
}

function loadConfig(): DepositConfig {
  const rpcUrl = process.env.BSC_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const amount = process.argv[2] || '0.01';

  if (!rpcUrl) throw new Error('BSC_RPC_URL required');
  if (!privateKey) throw new Error('PRIVATE_KEY required');

  return { rpcUrl, privateKey, amount };
}

async function main() {
  try {
    const config = loadConfig();
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);

    console.log('💰 CashMatrix Vault Deposit');
    console.log(`From: ${wallet.address}`);
    console.log(`Vault: ${VAULT_ADDRESS}`);
    console.log(`Amount: ${config.amount} BNB`);

    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);
    const asset = await vault.asset();
    console.log(`Asset: ${asset}`);

    const assetToken = new ethers.Contract(asset, ERC20_ABI, wallet);
    const decimals = await assetToken.decimals();

    const amountWei = ethers.utils.parseUnits(config.amount, decimals);
    console.log(`Amount in wei: ${amountWei.toString()}`);

    // Check balance
    const balance = await assetToken.balanceOf(wallet.address);
    console.log(`Your balance: ${ethers.utils.formatUnits(balance, decimals)}`);

    if (balance.lt(amountWei)) {
      throw new Error(`Insufficient balance. Have ${ethers.utils.formatUnits(balance, decimals)}, need ${config.amount}`);
    }

    // Check allowance
    const allowance = await assetToken.allowance(wallet.address, VAULT_ADDRESS);
    console.log(`Current allowance: ${ethers.utils.formatUnits(allowance, decimals)}`);

    if (allowance.lt(amountWei)) {
      console.log('Approving vault to spend tokens...');
      const approveTx = await assetToken.approve(VAULT_ADDRESS, amountWei);
      await approveTx.wait();
      console.log(`Approved: ${approveTx.hash}`);
    }

    // Preview deposit
    const preview = await vault.previewDeposit(amountWei);
    console.log(`Expected shares: ${ethers.utils.formatUnits(preview, decimals)}`);

    // Execute deposit
    console.log('Depositing...');
    const depositTx = await vault.deposit(amountWei, wallet.address);
    console.log(`Transaction: ${depositTx.hash}`);
    
    const receipt = await depositTx.wait();
    console.log(`✅ Deposited in block ${receipt.blockNumber}`);

    // Check new state
    const newTotal = await vault.totalAssets();
    console.log(`Vault total assets: ${ethers.utils.formatUnits(newTotal, decimals)}`);

  } catch (err: any) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

main();
