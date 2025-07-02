import path from 'path';
import { createSpinner } from 'nanospinner';
import { runCommand } from '../utils/command.js';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '../utils/messages.js';
import { isNodeRunning, isCodexInstalled, startPeriodicLogging, getWalletAddress, setWalletAddress } from '../services/nodeService.js';
import inquirer from 'inquirer';
import boxen from 'boxen';
import chalk from 'chalk';
import os from 'os';
import { exec } from 'child_process';
import axios from 'axios';

const platform = os.platform();

async function promptForWalletAddress() {
    const { wallet } = await inquirer.prompt([
        {
            type: 'input',
            name: 'wallet',
            message: 'Please enter your ERC20 wallet address (or press enter to skip):',
            validate: (input) => {
                if (!input) return true; // Allow empty input
                if (/^0x[a-fA-F0-9]{40}$/.test(input)) return true;
                return 'Please enter a valid ERC20 wallet address (0x followed by 40 hexadecimal characters) or press enter to skip';
            }
        }
    ]);
    return wallet || null;
}

function getCurrentLogFile(config) {
    const timestamp = new Date().toISOString()
        .replaceAll(":", "-")
        .replaceAll(".", "-");
    return path.join(config.logsDir, `codex_${timestamp}.log`);
}

export async function runCodex(config, showNavigationMenu) {
    const isInstalled = await isCodexInstalled(config);
    if (!isInstalled) {
        console.log(showErrorMessage('Codex is not installed. Please install Codex first using option 1 from the main menu.'));
        await showNavigationMenu();
        return;
    }

    const nodeAlreadyRunning = await isNodeRunning(config);

    if (nodeAlreadyRunning) {
        console.log(showInfoMessage('A Codex node is already running.'));
        await showNavigationMenu();
    } else {
        try {
            let nat;
            if (platform === 'win32') {
                const result = await runCommand('for /f "delims=" %a in (\'curl -s --ssl-reqd ip.codex.storage\') do @echo %a');
                nat = result.trim();
            } else {
                nat = await runCommand('curl -s https://ip.codex.storage');
            }

            if (config.dataDir.length < 1) throw new Error("Missing config: dataDir");
            if (config.logsDir.length < 1) throw new Error("Missing config: logsDir");
            const logFilePath = getCurrentLogFile(config);

            console.log(showInfoMessage(
                `Data location: ${config.dataDir}\n` +
                `Logs: ${logFilePath}\n` +
                `API port: ${config.ports.apiPort}`
            ));

            const executable = config.codexExe;
            const args = [
                `--data-dir="${config.dataDir}"`,
                `--api-cors-origin="*"`,
                `--storage-quota=11811160064`,
                `--bootstrap-node=spr:CiUIAhIhAiJvIcA_ZwPZ9ugVKDbmqwhJZaig5zKyLiuaicRcCGqLEgIDARo8CicAJQgCEiECIm8hwD9nA9n26BUoNuarCEllqKDnMrIuK5qJxFwIaosQ3d6esAYaCwoJBJ_f8zKRAnU6KkYwRAIgM0MvWNJL296kJ9gWvfatfmVvT-A7O2s8Mxp8l9c8EW0CIC-h-H-jBVSgFjg3Eny2u33qF7BDnWFzo7fGfZ7_qc9P`,
                `--bootstrap-node=spr:CiUIAhIhAyUvcPkKoGE7-gh84RmKIPHJPdsX5Ugm_IHVJgF-Mmu_EgIDARo8CicAJQgCEiEDJS9w-QqgYTv6CHzhGYog8ck92xflSCb8gdUmAX4ya78QoemesAYaCwoJBES39Q2RAnVOKkYwRAIgLi3rouyaZFS_Uilx8k99ySdQCP1tsmLR21tDb9p8LcgCIG30o5YnEooQ1n6tgm9fCT7s53k6XlxyeSkD_uIO9mb3`,
                `--bootstrap-node=spr:CiUIAhIhA7E4DEMer8nUOIUSaNPA4z6x0n9Xaknd28Cfw9S2-cCeEgIDARo8CicAJQgCEiEDsTgMQx6vydQ4hRJo08DjPrHSf1dqSd3bwJ_D1Lb5wJ4Qt_CesAYaCwoJBEDhWZORAnVYKkYwRAIgFNzhnftocLlVHJl1onuhbSUM7MysXPV6dawHAA0DZNsCIDRVu9gnPTH5UkcRXLtt7MLHCo4-DL-RCMyTcMxYBXL0`,
                `--bootstrap-node=spr:CiUIAhIhAzZn3JmJab46BNjadVnLNQKbhnN3eYxwqpteKYY32SbOEgIDARo8CicAJQgCEiEDNmfcmYlpvjoE2Np1Wcs1ApuGc3d5jHCqm14phjfZJs4QrvWesAYaCwoJBKpA-TaRAnViKkcwRQIhANuMmZDD2c25xzTbKSirEpkZYoxbq-FU_lpI0K0e4mIVAiBfQX4yR47h1LCnHznXgDs6xx5DLO5q3lUcicqUeaqGeg`,
                `--bootstrap-node=spr:CiUIAhIhAgybmRwboqDdUJjeZrzh43sn5mp8jt6ENIb08tLn4x01EgIDARo8CicAJQgCEiECDJuZHBuioN1QmN5mvOHjeyfmanyO3oQ0hvTy0ufjHTUQh4ifsAYaCwoJBI_0zSiRAnVsKkcwRQIhAJCb_z0E3RsnQrEePdJzMSQrmn_ooHv6mbw1DOh5IbVNAiBbBJrWR8eBV6ftzMd6ofa5khNA2h88OBhMqHCIzSjCeA`,
                `--bootstrap-node=spr:CiUIAhIhAntGLadpfuBCD9XXfiN_43-V3L5VWgFCXxg4a8uhDdnYEgIDARo8CicAJQgCEiECe0Ytp2l-4EIP1dd-I3_jf5XcvlVaAUJfGDhry6EN2dgQsIufsAYaCwoJBNEmoCiRAnV2KkYwRAIgXO3bzd5VF8jLZG8r7dcLJ_FnQBYp1BcxrOvovEa40acCIDhQ14eJRoPwJ6GKgqOkXdaFAsoszl-HIRzYcXKeb7D9`,
                `--log-level=DEBUG`,
                `--log-file="${logFilePath}"`,
                `--storage-quota="${config.storageQuota}"`,
                `--disc-port=${config.ports.discPort}`,
                `--listen-addrs=/ip4/0.0.0.0/tcp/${config.ports.listenPort}`,
                `--api-port=${config.ports.apiPort}`,
                `--nat=extip:${nat}`,
                `--bootstrap-node=spr:CiUIAhIhAiJvIcA_ZwPZ9ugVKDbmqwhJZaig5zKyLiuaicRcCGqLEgIDARo8CicAJQgCEiECIm8hwD9nA9n26BUoNuarCEllqKDnMrIuK5qJxFwIaosQ3d6esAYaCwoJBJ_f8zKRAnU6KkYwRAIgM0MvWNJL296kJ9gWvfatfmVvT-A7O2s8Mxp8l9c8EW0CIC-h-H-jBVSgFjg3Eny2u33qF7BDnWFzo7fGfZ7_qc9P`
            ];

            const command =
                `"${executable}" ${args.join(" ")}`

            console.log(showInfoMessage(
                '🚀 Codex node is running...\n\n' +
                'If your firewall ask, be sure to allow Codex to receive connections. \n' +
                'Please keep this terminal open. Start a new terminal to interact with the node.\n\n' +
                'Press CTRL+C to stop the node'
            ));

            const nodeProcess = exec(command);

            await new Promise(resolve => setTimeout(resolve, 5000));

            try {
                const response = await axios.get(`http://localhost:${config.ports.apiPort}/api/codex/v1/debug/info`);
                if (response.status === 200) {
                    // Check if wallet exists
                    try {
                        const existingWallet = await getWalletAddress();
                        if (!existingWallet) {
                            console.log(showInfoMessage('[OPTIONAL] Please provide your ERC20 wallet address.'));
                            const wallet = await promptForWalletAddress();
                            if (wallet) {
                                await setWalletAddress(wallet);
                                console.log(showSuccessMessage('Wallet address saved successfully!'));
                            }
                        }
                    } catch (error) {
                        console.log(showErrorMessage('Failed to process wallet address. Continuing without wallet update.'));
                    }

                    // Start periodic logging
                    const stopLogging = await startPeriodicLogging(config);

                    nodeProcess.on('exit', () => {
                        stopLogging();
                    });

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
                '3. Update Wallet Address',
                '4. Back to Main Menu',
                '5. Exit'
            ],
            pageSize: 5,
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
            try {
                const existingWallet = await getWalletAddress();

                console.log(boxen(
                    `${chalk.cyan('Current wallet address:')}\n${existingWallet || 'Not set'}`,
                    {
                        padding: 1,
                        margin: 1,
                        borderStyle: 'round',
                        borderColor: 'blue'
                    }
                ));

                const wallet = await promptForWalletAddress();
                if (wallet) {
                    await setWalletAddress(wallet);
                    console.log(showSuccessMessage('Wallet address updated successfully!'));
                }
            } catch (error) {
                console.log(showErrorMessage(`Failed to update wallet address: ${error.message}`));
            }
            return showNodeDetails(data, showNavigationMenu);
        case '4':
            return showNavigationMenu();
        case '5':
            process.exit(0);
    }
}

export async function checkNodeStatus(config, showNavigationMenu) {
    try {
        const nodeRunning = await isNodeRunning(config);

        if (nodeRunning) {
            const spinner = createSpinner('Checking node status...').start();
            const response = await runCommand(`curl http://localhost:${config.ports.apiPort}/api/codex/v1/debug/info`);
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