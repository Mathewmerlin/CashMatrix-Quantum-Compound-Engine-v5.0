/**
 * TASK 3: Fail-Safe Circuit Breaker & Auto-Resume Heartbeat Sentinel
 * Filename: circuitBreaker.cjs
 * CashMatrix Quantum-Compound Engine v5.0 (BSC Testnet Chain 97)
 */
const http = require('http');
const { execSync } = require('child_process');

const CONFIG = {
    RPC_URL: 'http://localhost:8545',
    GAS_CEILING_GWEI: 20,
    CHECK_INTERVAL_MS: 3000
};

let sentinelState = {
    isTripped: false,
    lastCheckedGwei: 10,
    consecutiveFailures: 0
};

function queryNativeRpc(method, params = []) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 });
        const req = http.request(CONFIG.RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', err => reject(err));
        req.write(data);
        req.end();
    });
}

async function monitorHeartbeat() {
    console.log(`[TASK 3 SENTINEL] Circuit Breaker & Auto-Resume Heartbeat Active. Monitoring ceiling: ${CONFIG.GAS_CEILING_GWEI} Gwei.`);

    setInterval(async () => {
        try {
            const response = await queryNativeRpc("eth_gasPrice");
            if (response && response.result) {
                const gweiPrice = parseInt(response.result, 16) / 1e9;
                sentinelState.lastCheckedGwei = gweiPrice;
                sentinelState.consecutiveFailures = 0;

                if (gweiPrice > CONFIG.GAS_CEILING_GWEI && !sentinelState.isTripped) {
                    tripSentinel(`Gas spike detected (${gweiPrice} Gwei > ${CONFIG.GAS_CEILING_GWEI} Gwei ceiling).`);
                } else if (gweiPrice <= CONFIG.GAS_CEILING_GWEI && sentinelState.isTripped) {
                    healSentinel(`Gas normalized (${gweiPrice} Gwei).`);
                }
            }
        } catch (err) {
            sentinelState.consecutiveFailures++;
            console.error(`[SENTINEL WARNING] Failed to query sovereign RPC node (${sentinelState.consecutiveFailures} consecutive).`);
            if (sentinelState.consecutiveFailures >= 3 && !sentinelState.isTripped) {
                tripSentinel("RPC node connection lost or unresponsive.");
            }
        }
    }, CONFIG.CHECK_INTERVAL_MS);
}

function tripSentinel(reason) {
    sentinelState.isTripped = true;
    console.warn(`[CIRCUIT BREAKER] 🔴 TRIPPED: ${reason}`);
    try {
        execSync('pm2 stop cashmatrix-keeper');
        console.log(`[PM2 CONTROLLER] Keeper bot process successfully paused for safety.`);
    } catch (e) {
        console.error(`[PM2 ERROR] Failed to pause keeper process:`, e.message);
    }
}

function healSentinel(reason) {
    sentinelState.isTripped = false;
    console.log(`[CIRCUIT BREAKER] 🟢 AUTO-HEALED: ${reason}`);
    try {
        execSync('pm2 restart cashmatrix-keeper');
        console.log(`[PM2 CONTROLLER] Keeper bot process successfully re-enabled and resumed!`);
    } catch (e) {
        console.error(`[PM2 ERROR] Failed to restart keeper process:`, e.message);
    }
}

monitorHeartbeat();
