import { createSpinner } from 'nanospinner';
import { runCommand } from '../utils/command.js';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '../utils/messages.js';
import { isNodeRunning, isCodexInstalled, logToSupabase } from '../services/nodeService.js';
import inquirer from 'inquirer';
import boxen from 'boxen';
import chalk from 'chalk';
import os from 'os';
import { exec } from 'child_process';
import axios from 'axios';

const platform = os.platform();

export async function runCodex(showNavigationMenu) {
    const isInstalled = await isCodexInstalled();
    if (!isInstalled) {
        console.log(showErrorMessage('Codex is not installed. Please install Codex first using option 1 from the main menu.'));
        await showNavigationMenu();
        return;
    }

    const nodeAlreadyRunning = await isNodeRunning();

    if (nodeAlreadyRunning) {
        console.log(showInfoMessage('A Codex node is already running.'));
        await showNavigationMenu();
    } else {
        const { discPort, listenPort } = await inquirer.prompt([
            {
                type: 'number',
                name: 'discPort',
                message: 'Enter the discovery port (default is 8090):',
                default: 8090
            },
            {
                type: 'number',
                name: 'listenPort',
                message: 'Enter the listening port (default is 8070):',
                default: 8070
            }
        ]);

        try {
            if (platform === 'win32') {
                console.log(showInfoMessage('Setting up firewall rules...'));
                await runCommand(`netsh advfirewall firewall add rule name="Allow Codex (TCP-In)" protocol=TCP dir=in localport=${listenPort} action=allow`);
                await runCommand(`netsh advfirewall firewall add rule name="Allow Codex (UDP-In)" protocol=UDP dir=in localport=${discPort} action=allow`);
            }

            let nat;
            if (platform === 'win32') {
                const result = await runCommand('for /f "delims=" %a in (\'curl -s --ssl-reqd ip.codex.storage\') do @echo %a');
                nat = result.trim();
            } else {
                nat = await runCommand('curl -s https://ip.codex.storage');
            }

            const command = platform === 'win32' 
                ? `codex ^
                    --data-dir=datadir ^
                    --disc-port=${discPort} ^
                    --listen-addrs=/ip4/0.0.0.0/tcp/${listenPort} ^
                    --nat=${nat} ^
                    --api-cors-origin="*" ^
                    --bootstrap-node=spr:CiUIAhIhAiJvIcA_ZwPZ9ugVKDbmqwhJZaig5zKyLiuaicRcCGqLEgIDARo8CicAJQgCEiECIm8hwD9nA9n26BUoNuarCEllqKDnMrIuK5qJxFwIaosQ3d6esAYaCwoJBJ_f8zKRAnU6KkYwRAIgM0MvWNJL296kJ9gWvfatfmVvT-A7O2s8Mxp8l9c8EW0CIC-h-H-jBVSgFjg3Eny2u33qF7BDnWFzo7fGfZ7_qc9P`
                : `codex \
                    --data-dir=datadir \
                    --disc-port=${discPort} \
                    --listen-addrs=/ip4/0.0.0.0/tcp/${listenPort} \
                    --nat=\`curl -s https://ip.codex.storage\` \
                    --api-cors-origin="*" \
                    --bootstrap-node=spr:CiUIAhIhAiJvIcA_ZwPZ9ugVKDbmqwhJZaig5zKyLiuaicRcCGqLEgIDARo8CicAJQgCEiECIm8hwD9nA9n26BUoNuarCEllqKDnMrIuK5qJxFwIaosQ3d6esAYaCwoJBJ_f8zKRAnU6KkYwRAIgM0MvWNJL296kJ9gWvfatfmVvT-A7O2s8Mxp8l9c8EW0CIC-h-H-jBVSgFjg3Eny2u33qF7BDnWFzo7fGfZ7_qc9P`;

            console.log(showInfoMessage(
                '🚀 Codex node is running...\n\n' +
                'Please keep this terminal open. Start a new terminal to interact with the node.\n\n' +
                'Press CTRL+C to stop the node'
            ));

            const nodeProcess = exec(command);

            await new Promise(resolve => setTimeout(resolve, 5000));

            try {
                const response = await axios.get('http://localhost:8080/api/codex/v1/debug/info');
                if (response.status === 200) {
                    await logToSupabase(response.data);
                    console.log(boxen(
                        chalk.cyan('We are logging some of your node\'s public data for improving the Codex experience'),
                        {
                            padding: 1,
                            margin: 1,
                            borderStyle: 'round',
                            borderColor: 'cyan',
                            title: '🔒 Privacy Notice',
                            titleAlignment: 'center',
                            dimBorder: true
                        }
                    ));
                }
            } catch (error) {
                // Silently handle any logging errors
            }

            await new Promise((resolve, reject) => {
                nodeProcess.on('exit', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Node exited with code ${code}`));
                });
            });

            if (platform === 'win32') {
                console.log(showInfoMessage('Cleaning up firewall rules...'));
                await runCommand('netsh advfirewall firewall delete rule name="Allow Codex (TCP-In)"');
                await runCommand('netsh advfirewall firewall delete rule name="Allow Codex (UDP-In)"');
            }

        } catch (error) {
            console.log(showErrorMessage(`Failed to run Codex: ${error.message}`));
        }
        await showNavigationMenu();
    }
}

async function showNodeDetails(data, showNavigationMenu) {
    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Select information to view:',
            choices: [
                '1. View Connected Peers',
                '2. View Node Information',
                '3. Back to Main Menu',
                '4. Exit'
            ],
            pageSize: 4,
            loop: true
        }
    ]);

    switch (choice.split('.')[0].trim()) {
        case '1':
            const peerCount = data.table.nodes.length;
            if (peerCount > 0) {
                console.log(showInfoMessage('Connected Peers'));
                data.table.nodes.forEach((node, index) => {
                    console.log(boxen(
                        `Peer ${index + 1}:\n` +
                        `${chalk.cyan('Peer ID:')} ${node.peerId}\n` +
                        `${chalk.cyan('Address:')} ${node.address}\n` +
                        `${chalk.cyan('Status:')} ${node.seen ? chalk.green('Active') : chalk.gray('Inactive')}`,
                        {
                            padding: 1,
                            margin: 1,
                            borderStyle: 'round',
                            borderColor: 'blue'
                        }
                    ));
                });
            } else {
                console.log(showInfoMessage('No connected peers found.'));
            }
            return showNodeDetails(data, showNavigationMenu);
        case '2':
            console.log(boxen(
                `${chalk.cyan('Version:')} ${data.codex.version}\n` +
                `${chalk.cyan('Revision:')} ${data.codex.revision}\n\n` +
                `${chalk.cyan('Node ID:')} ${data.table.localNode.nodeId}\n` +
                `${chalk.cyan('Peer ID:')} ${data.table.localNode.peerId}\n` +
                `${chalk.cyan('Listening Address:')} ${data.table.localNode.address}\n\n` +
                `${chalk.cyan('Public IP:')} ${data.announceAddresses[0].split('/')[2]}\n` +
                `${chalk.cyan('Port:')} ${data.announceAddresses[0].split('/')[4]}\n` +
                `${chalk.cyan('Connected Peers:')} ${data.table.nodes.length}`,
                {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'yellow',
                    title: '📊 Node Information',
                    titleAlignment: 'center'
                }
            ));
            return showNodeDetails(data, showNavigationMenu);
        case '3':
            return showNavigationMenu();
        case '4':
            process.exit(0);
    }
}

export async function checkNodeStatus(showNavigationMenu) {
    try {
        const nodeRunning = await isNodeRunning();

        if (nodeRunning) {
            const spinner = createSpinner('Checking node status...').start();
            const response = await runCommand('curl http://localhost:8080/api/codex/v1/debug/info -w \'\\n\'');
            spinner.success();
            
            const data = JSON.parse(response);
            
            const peerCount = data.table.nodes.length;
            const isOnline = peerCount > 2;
            
            console.log(boxen(
                isOnline 
                    ? chalk.green('Node is ONLINE & DISCOVERABLE')
                    : chalk.yellow('Node is ONLINE but has few peers'),
                {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: isOnline ? 'green' : 'yellow',
                    title: '🔌 Node Status',
                    titleAlignment: 'center'
                }
            ));

            await showNodeDetails(data, showNavigationMenu);
        } else {
            console.log(showErrorMessage('Codex node is not running. Try again after starting the node'));
            await showNavigationMenu();
        }
    } catch (error) {
        console.log(showErrorMessage(`Failed to check node status: ${error.message}`));
        await showNavigationMenu();
    }
} 