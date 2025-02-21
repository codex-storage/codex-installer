import axios from 'axios';
import { runCommand } from '../utils/command.js';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '../utils/messages.js';
import os from 'os';
import { getCodexVersion } from '../handlers/installationHandlers.js';

const platform = os.platform();

// Add a variable to store wallet address in memory
let currentWallet = null;

export async function setWalletAddress(wallet) {
    // Basic ERC20 address validation
    if (wallet && !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        throw new Error('Invalid ERC20 wallet address format');
    }
    currentWallet = wallet;
}

export async function getWalletAddress() {
    return currentWallet;
}

export async function isNodeRunning(config) {
    try {
        const response = await axios.get(`http://localhost:${config.ports.apiPort}/api/codex/v1/debug/info`);
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

export async function isCodexInstalled(config) {
    try {
        const version = await getCodexVersion(config);
        return version.length > 0;
    } catch (error) {
        return false;
    }
}

export async function logToSupabase(nodeData, retryCount = 3, retryDelay = 1000) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const peerCount = nodeData.table.nodes ? nodeData.table.nodes.length : "0";
            const payload = {
                nodeId: nodeData.table.localNode.nodeId,
                peerId: nodeData.table.localNode.peerId,
                publicIp: nodeData.announceAddresses[0].split('/')[2],
                version: nodeData.codex.version,
                peerCount: peerCount == 0 ? "0" : peerCount,
                port: nodeData.announceAddresses[0].split('/')[4],
                listeningAddress: nodeData.table.localNode.address,
                timestamp: new Date().toISOString(),
                wallet: currentWallet
            };

            const response = await axios.post('https://vfcnsjxahocmzefhckfz.supabase.co/functions/v1/codexnodes', payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            return response.status === 200;
        } catch (error) {
            const isLastAttempt = attempt === retryCount;
            const isNetworkError = error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED';

            if (isLastAttempt || !isNetworkError) {
                console.error(`Failed to log node data (attempt ${attempt}/${retryCount}):`, error.message);
                if (error.response) {
                    console.error('Error response:', {
                        status: error.response.status,
                        data: error.response.data
                    });
                }
                if (isLastAttempt) return false;
            } else {
                // Only log retry attempts for network errors
                console.log(`Retrying to log data (attempt ${attempt}/${retryCount})...`);
                await delay(retryDelay);
            }
        }
    }
    return false;
}

export async function checkDependencies() {
    if (platform === 'linux') {
        try {
            await runCommand('ldconfig -p | grep libgomp');
            return true;
        } catch (error) {
            console.log(showErrorMessage('Required dependency libgomp1 is not installed.'));
            console.log(showInfoMessage(
                'For Debian-based Linux systems, please install it manually using:\n\n' +
                'sudo apt update && sudo apt install libgomp1'
            ));
            return false;
        }
    }
    return true;
}

export async function startPeriodicLogging(config) {
    const FIFTEEN_MINUTES = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    const logNodeInfo = async () => {
        try {
            const response = await axios.get(`http://localhost:${config.ports.apiPort}/api/codex/v1/debug/info`);
            if (response.status === 200) {
                await logToSupabase(response.data);
            }
        } catch (error) {
            // Silently handle any logging errors to not disrupt the node operation
            console.error('Failed to log node data:', error.message);
        }
    };

    // Initial log
    await logNodeInfo();

    // Set up periodic logging
    const intervalId = setInterval(logNodeInfo, FIFTEEN_MINUTES);

    // Return cleanup function
    return () => clearInterval(intervalId);
}

export async function updateWalletAddress(nodeId, wallet) {
    // Basic ERC20 address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        throw new Error('Invalid ERC20 wallet address format');
    }

    try {
        const response = await axios.post('https://vfcnsjxahocmzefhckfz.supabase.co/functions/v1/wallet', {
            nodeId,
            wallet
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        return response.status === 200;
    } catch (error) {
        console.error('Failed to update wallet address:', error.message);
        throw error;
    }
} 