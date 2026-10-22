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

const WBNB = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';

const WBNB_ABI = [
  "function deposit() payable",
  "function balanceOf(address) view returns (uint256)",
  "function withdraw(uint256)"
];

function loadConfig() {
  const rpcUrl = process.env.BSC_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  if (!rpcUrl) throw new Error('BSC_RPC_URL required');
  if (!privateKey) throw new Error('PRIVATE_KEY required');
  return { rpcUrl, privateKey };
}

async function main() {
  try {
    const config = loadConfig();
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);

    const amount = process.argv[2] || '0.05';
    const amountWei = ethers.utils.parseEther(amount);

    console.log('💰 Wrapping BNB to WBNB');
    console.log(`From: ${wallet.address}`);
    console.log(`Amount: ${amount} BNB`);

    const balance = await wallet.getBalance();
    console.log(`BNB balance: ${ethers.utils.formatEther(balance)}`);

    if (balance.lt(amountWei)) {
      throw new Error(`Insufficient BNB. Have ${ethers.utils.formatEther(balance)}, need ${amount}`);
    }

    const wbnb = new ethers.Contract(WBNB, WBNB_ABI, wallet);
    
    console.log('Sending wrap transaction...');
    const tx = await wbnb.deposit({ value: amountWei });
    console.log(`Transaction: ${tx.hash}`);
    
    await tx.wait();
    console.log('✅ Wrapped successfully');

    const wbnbBalance = await wbnb.balanceOf(wallet.address);
    console.log(`WBNB balance: ${ethers.utils.formatEther(wbnbBalance)}`);

  } catch (err: any) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

main();
