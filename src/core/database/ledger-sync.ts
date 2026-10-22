import * as fs from 'fs';
import * as path from 'path';

const ledgerPath = path.join(process.cwd(), 'ledger-cache.json');

export interface LedgerEntry {
  batch: string;
  pair: string;
  txHash: string;
  yieldGenerated: string;
  userShare: string;
  timestamp: string;
}

export function saveLedgerEntry(entry: LedgerEntry) {
  let records: LedgerEntry[] = [];
  if (fs.existsSync(ledgerPath)) {
    try {
      records = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    } catch {
      records = [];
    }
  }
  records.unshift(entry);
  // Fixed slice call (retained top 50 records)
  fs.writeFileSync(ledgerPath, JSON.stringify(records.slice(0, 50), null, 2));
}

export function getLedgerRecords(): LedgerEntry[] {
  if (!fs.existsSync(ledgerPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  } catch {
    return [];
  }
}
