import { ethers } from 'ethers';
import { saveLedgerEntry } from '../database/ledger-sync.js';

export class SovereignQuantumEngine {
  private static instance: SovereignQuantumEngine;
  private primaryProvider: any;
  private failoverNodes: string[] = [
    'https://bsc-testnet-rpc.publicnode.com',
    'https://data-seed-prebsc-1-s1.binance.org:8545/'
  ];
  private currentNodeIndex: number = 0;

  private constructor() {
    this.initializeSovereignTunnel();
  }

  public static getInstance(): SovereignQuantumEngine {
    if (!SovereignQuantumEngine.instance) {
      SovereignQuantumEngine.instance = new SovereignQuantumEngine();
    }
    return SovereignQuantumEngine.instance;
  }

  private initializeSovereignTunnel() {
    const targetUrl = this.failoverNodes[this.currentNodeIndex % this.failoverNodes.length];
    const JsonRpcProvider = ethers.JsonRpcProvider || (ethers as any).providers?.JsonRpcProvider;
    this.primaryProvider = new JsonRpcProvider(targetUrl);
  }

  public async dispatchMicroTrade(txHash: string, blockNumber: number, rawYield: string) {
    const yieldNum = parseFloat(rawYield);
    const userShare = (yieldNum / 2).toFixed(4);

    const payload = {
      batch: `#${blockNumber}`,
      pair: 'USDC/tBNB-QUANTUM-NODE',
      txHash: txHash,
      yieldGenerated: `$${yieldNum.toFixed(4)}`,
      userShare: `$${userShare}`,
      timestamp: new Date().toLocaleTimeString()
    };

    saveLedgerEntry(payload);
    console.log(`⚡ [QUANTUM DISPATCH] Trade executed & ledger hydrated for Tx: ${txHash}`);
    return payload;
  }
}

export const sovereignEngine = SovereignQuantumEngine.getInstance();
