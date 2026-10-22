/**
 * Production Configuration & Deployment Specification for CashMatrix DApp
 * Target Domain: https://bscsan.nl
 * Target Hosting: GoDaddy cPanel (Apache / Nginx Web Root)
 * Target Blockchain: BNB Smart Chain Testnet (Chain ID 97)
 */

import { DEPLOYED_CONTRACTS } from './contracts';

export interface BscTokenConfig {
  symbol: 'USDT' | 'USDC' | 'BNB';
  name: string;
  decimals: number;
  contractAddress: string;
  icon: string;
}

export const PRODUCTION_CONFIG = {
  appName: 'CashMatrix Quantum-Compound Engine',
  domain: 'bscsan.nl',
  officialUrl: 'https://bscsan.nl',
  primaryChainId: '0x61', // 97
  primaryChainIdDec: 97,
  networkName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcEndpoints: [
    'https://data-seed-prebsc-1-s1.binance.org:8545/',
    'https://data-seed-prebsc-2-s1.binance.org:8545/',
    'https://data-seed-prebsc-1-s2.binance.org:8545/',
  ],
  blockExplorer: 'https://testnet.bscscan.com',
  treasuryAccount: '0x71C94B3b7f884a29a059A9482928cB7239A2F86B',

  // Master Engine Pointers
  contracts: DEPLOYED_CONTRACTS,
  vaultContractAddress: DEPLOYED_CONTRACTS.omniGenesisMaster,
  circuitBreakerAddress: DEPLOYED_CONTRACTS.vaultCircuitBreaker,
  timelockAddress: DEPLOYED_CONTRACTS.cashMatrixTimelock,
  complianceGate: DEPLOYED_CONTRACTS.institutionalComplianceGate,
  daoAddress: DEPLOYED_CONTRACTS.strategyProposalDAO,

  tokens: {
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD (Testnet)',
      decimals: 18,
      contractAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      icon: '💵',
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin (Testnet)',
      decimals: 18,
      contractAddress: '0x64544969ed7EBf5f083679233325356EbE738930',
      icon: '🪙',
    },
    BNB: {
      symbol: 'BNB',
      name: 'tBNB Native Coin',
      decimals: 18,
      contractAddress: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB Testnet
      icon: '⚡',
    },
  } as Record<string, BscTokenConfig>,
  lockDurationDays: 30,
  profitSplit: {
    userPercentage: 50,
    adminPercentage: 50,
  },
  gasSafetyBufferBnb: 0.005,
  security: {
    antiPhishingDomain: 'bscsan.nl',
    requireWalletSignature: true,
    sessionTimeoutMinutes: 15,
  },
};

export const GODADDY_HTACCESS_TEMPLATE = `# =====================================================================
# CashMatrix Production .htaccess for GoDaddy Hosting (bscsan.nl)
# =====================================================================

RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{HTTP_HOST} ^www\\.bscsan\\.nl [NC]
RewriteRule ^(.*)$ https://bscsan.nl/$1 [L,R=301]

<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.binance.org https://bscrpc.com https://*.llamarpc.com https://*.bscscan.com wss://*.walletconnect.org https://*.walletconnect.org; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;"
</IfModule>

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/gif "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
`;
