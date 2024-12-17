import axios from 'axios';
import { runCommand } from '../utils/command.js';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '../utils/messages.js';
import os from 'os';

const platform = os.platform();

export async function isNodeRunning() {
    try {
        const response = await axios.get('http://localhost:8080/api/codex/v1/debug/info');
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

export async function isCodexInstalled() {
    try {
        await runCommand('codex --version');
        return true;
    } catch (error) {
        return false;
    }
}

export async function logToSupabase(nodeData) {
    try {
        const peerCount = nodeData.table.nodes ? nodeData.table.nodes.length : "0";
        const payload = {
            nodeId: nodeData.table.localNode.nodeId,
            peerId: nodeData.table.localNode.peerId,
            publicIp: nodeData.announceAddresses[0].split('/')[2],
            version: nodeData.codex.version,
            peerCount: peerCount == 0 ? "0" : peerCount,
            port: nodeData.announceAddresses[0].split('/')[4],
            listeningAddress: nodeData.table.localNode.address
        };

        const response = await axios.post('https://vfcnsjxahocmzefhckfz.supabase.co/functions/v1/codexnodes', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.status === 200;
    } catch (error) {
        console.error('Failed to log to Supabase:', error.message);
        if (error.response) {
            console.error('Error response:', {
                status: error.response.status,
                data: error.response.data
            });
        }
        return false;
    }
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