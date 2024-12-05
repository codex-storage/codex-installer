#!/usr/bin/env node

import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { createSpinner } from 'nanospinner';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios'; 
import * as fs from 'fs/promises';
import boxen from 'boxen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);
const platform = os.platform();

const ASCII_ART = `
██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗                  
██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝                  
██║     ██║   ██║██║  ██║█████╗   ╚███╔╝                   
██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗                   
╚██████╗╚██████╔╝██████╔╝██████��� ██╗                  
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝                  
                                                           
███████╗████████╗ ██████╗ ██████╗  █████╗  ██████╗ ███████╗
██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝ █╔════╝
███████╗   ██║   ██║   ██║██████╔╝███████║██║  ███╗█████╗  
╚════██║   ██║   ██║   ██║██╔══██╗██╔══██║██║   ██║██╔══╝  
███████║   ██║   ╚██████╔╝██║  ██║██║  ██║╚██████╔╝███████╗
╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝

+--------------------------------------------------------------------+
| Docs : docs.codex.storage   |   Discord : discord.gg/codex-storage |
+--------------------------------------------------------------------+
`;

function showSuccessMessage(message) {
    return boxen(chalk.green(message), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ SUCCESS',
        titleAlignment: 'center'
    });
}

function showErrorMessage(message) {
    return boxen(chalk.red(message), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red',
        title: '❌ ERROR',
        titleAlignment: 'center'
    });
}

function showInfoMessage(message) {
    return boxen(chalk.cyan(message), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        title: 'ℹ️  INFO',
        titleAlignment: 'center'
    });
}

async function runCommand(command) {
    try {
        const { stdout, stderr } = await execAsync(command);
        return stdout;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

async function showNavigationMenu() {
    console.log('\n')
    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'What would you like to do?',
            choices: [
                '1. Back to main menu',
                '2. Exit'
            ],
            pageSize: 2,
            loop: true
        }
    ]);

    switch (choice.split('.')[0]) {
        case '1':
            return main(); // Returns to main menu
        case '2':
            handleExit();
    }
}

async function checkCodexInstallation() {
    try {
        const version = await runCommand('codex --version');
        console.log(chalk.green('Codex is already installed. Version:'));
        console.log(chalk.green(version));
        await showNavigationMenu();
    } catch (error) {
        console.log(chalk.cyanBright('Codex is not installed, proceeding with installation...'));
        await installCodex();
    }
}

async function showPrivacyDisclaimer() {
    const disclaimer = boxen(`
${chalk.yellow.bold('Privacy Disclaimer')}

Codex is currently in testnet and to make your testnet experience better, we are currently tracking some of your node and network information such as:

${chalk.cyan('- Node ID')}
${chalk.cyan('- Peer ID')}
${chalk.cyan('- Public IP address')}
${chalk.cyan('- Codex node version')}
${chalk.cyan('- Number of connected peers')}
${chalk.cyan('- Discovery and listening ports')}

These information will be used for calculating various metrics that can eventually make the Codex experience better. Please agree to the following disclaimer to continue using the Codex Storage CLI or alternatively, use the manual setup instructions at docs.codex.storage.
`, {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'yellow',
        title: '📋 IMPORTANT',
        titleAlignment: 'center'
    });

    console.log(disclaimer);

    const { agreement } = await inquirer.prompt([
        {
            type: 'input',
            name: 'agreement',
            message: 'Do you agree to the privacy disclaimer? (y/n):',
            validate: (input) => {
                const lowercased = input.toLowerCase();
                if (lowercased === 'y' || lowercased === 'n') {
                    return true;
                }
                return 'Please enter either y or n';
            }
        }
    ]);

    return agreement.toLowerCase() === 'y';
}

async function checkDependencies() {
    if (platform === 'linux') {
        try {
            await runCommand('ldconfig -p | grep libgomp');
            return true;
        } catch (error) {
            console.log(showErrorMessage('Required dependency libgomp1 is not installed.'));
            console.log(showInfoMessage(
                'For Debian-based Linux systems, please install it manually using:\n\n' +
                chalk.white('sudo apt update && sudo apt install libgomp1')
            ));
            return false;
        }
    }
    return true;
}

async function installCodex() {
    if (platform === 'win32') {
        console.log(showInfoMessage('Coming soon for Windows!'));
        return;
    }

    // Show privacy disclaimer first
    const agreed = await showPrivacyDisclaimer();
    if (!agreed) {
        console.log(showInfoMessage('You can find manual setup instructions at docs.codex.storage'));
        handleExit();
        return;
    }

    try {
        // Check dependencies only for Linux
        const dependenciesInstalled = await checkDependencies();
        if (!dependenciesInstalled) {
            console.log(showInfoMessage('Please install the required dependencies and try again.'));
            await showNavigationMenu();
            return;
        }

        const spinner = createSpinner('Downloading Codex binaries...').start();
        const downloadCommand = 'curl -# -L https://get.codex.storage/install.sh | bash';
        await runCommand(downloadCommand);
        spinner.success();
        
        const version = await runCommand('\ncodex --version');
        console.log(showSuccessMessage(
            'Codex is successfully installed!\n\n' +
            `Version: ${version}`
        ));
        await showNavigationMenu();
    } catch (error) {
        console.log(showErrorMessage(`Failed to install Codex: ${error.message}`));
        await showNavigationMenu();
    }
}

async function isNodeRunning() {
    try {
        const response = await axios.get('http://localhost:8080/api/codex/v1/debug/info');
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

async function runCodex() {
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
            const command = `codex \
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

            // Start the node
            const nodeProcess = exec(command);

            // Wait for node to start and get initial data
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Log node data to Supabase
            try {
                const response = await axios.get('http://localhost:8080/api/codex/v1/debug/info');
                if (response.status === 200) {
                    await logToSupabase(response.data);
                    console.log(showSuccessMessage('Node data logged successfully'));
                }
            } catch (error) {
                console.log(showErrorMessage(`Failed to log node data: ${error.message}`));
            }

            // Wait for node process to exit
            await new Promise((resolve, reject) => {
                nodeProcess.on('exit', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Node exited with code ${code}`));
                });
            });
        } catch (error) {
            console.log(showErrorMessage(`Failed to run Codex: ${error.message}`));
        }
        await showNavigationMenu();
    }
}

async function logToSupabase(nodeData) {
    try {
        // Ensure peerCount is at least 0 (not undefined or null)
        const peerCount = nodeData.table.nodes ? nodeData.table.nodes.length : "0";
        console.log("peerCount is",peerCount);
        const payload = {
            nodeId: nodeData.table.localNode.nodeId,
            peerId: nodeData.table.localNode.peerId,
            publicIp: nodeData.announceAddresses[0].split('/')[2],
            version: nodeData.codex.version,
            peerCount: peerCount == 0 ? "0" : peerCount,
            port: nodeData.announceAddresses[0].split('/')[4],
            listeningAddress: nodeData.table.localNode.address
        };

        console.log('Sending data to Supabase:', JSON.stringify(payload, null, 2));

        const response = await axios.post('https://vfcnsjxahocmzefhckfz.supabase.co/functions/v1/codexnodes', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            console.log('Successfully logged to Supabase');
            return true;
        } else {
            console.error('Unexpected response:', response.status, response.data);
            return false;
        }
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

async function showNodeDetails(data) {
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
            return showNodeDetails(data);
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
            return showNodeDetails(data);
        case '3':
            return main();
        case '4':
            handleExit();
            break;
    }
}

async function checkNodeStatus() {
    if (platform === 'win32') {
        console.log(showInfoMessage('Coming soon for Windows!'));
        return;
    }

    try {
        const nodeRunning = await isNodeRunning();

        if (nodeRunning) {
            const spinner = createSpinner('Checking node status...').start();
            const response = await runCommand('curl http://localhost:8080/api/codex/v1/debug/info -w \'\\n\'');
            spinner.success();
            
            // Parse the JSON response
            const data = JSON.parse(response);
            
            // Determine if node is online and discoverable
            const peerCount = data.table.nodes.length;
            const isOnline = peerCount > 2;
            
            // Show status banner
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

            // Show interactive menu for details
            await showNodeDetails(data);
        } else {
            console.log(showErrorMessage('Codex node is not running. Try again after starting the node'));
            await showNavigationMenu();
        }
    } catch (error) {
        console.log(showErrorMessage(`Failed to check node status: ${error.message}`));
        await showNavigationMenu();
    }
}

// Define this function once, near the top of the file
function handleCommandLineOperation() {
    return process.argv.length > 2;
}

async function uploadFile(filePath = null) {
    if (platform === 'win32') {
        console.log(showInfoMessage('Coming soon for Windows!'));
        return;
    }

    const nodeRunning = await isNodeRunning();
    if (!nodeRunning) {
        console.log(showErrorMessage('Codex node is not running. Try again after starting the node'));
        return handleCommandLineOperation() ? process.exit(1) : showNavigationMenu();
    }

    console.log(boxen(
        chalk.yellow('⚠️  Codex does not encrypt files. Anything uploaded will be available publicly on testnet.\nThe testnet does not provide any guarantees - please do not use in production.'),
        {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow',
            title: '⚠️ Warning',
            titleAlignment: 'center'
        }
    ));

    let fileToUpload = filePath;
    if (!fileToUpload) {
        const { inputPath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'inputPath',
                message: 'Enter the file path to upload:',
                validate: input => input.length > 0
            }
        ]);
        fileToUpload = inputPath;
    }

    try {
        // Check if file exists
        await fs.access(fileToUpload);
        
        const spinner = createSpinner('Uploading file').start();
        try {
            const result = await runCommand(`curl -X POST http://localhost:8080/api/codex/v1/data -H 'Content-Type: application/octet-stream' -w '\\n' -T ${fileToUpload}`);
            spinner.success();
            console.log(showSuccessMessage('Successfully uploaded!\n\nCID: ' + result.trim()));
        } catch (error) {
            spinner.error();
            throw new Error(`Failed to upload: ${error.message}`);
        }
    } catch (error) {
        console.log(showErrorMessage(error.code === 'ENOENT' 
            ? `File not found: ${fileToUpload}` 
            : `Error uploading file: ${error.message}`));
    }

    return handleCommandLineOperation() ? process.exit(0) : showNavigationMenu();
}

function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    if (args.length === 0) return null;

    switch (args[0]) {
        case '--upload':
            if (args.length !== 2) {
                console.log(showErrorMessage('Usage: npx codexstorage --upload <filename>'));
                process.exit(1);
            }
            return { command: 'upload', value: args[1] };
        
        case '--download':
            if (args.length !== 2) {
                console.log(showErrorMessage('Usage: npx codexstorage --download <cid>'));
                process.exit(1);
            }
            return { command: 'download', value: args[1] };
        
        default:
            console.log(showErrorMessage(
                'Invalid command. Available commands:\n\n' +
                'npx codexstorage\n' +
                'npx codexstorage --upload <filename>\n' +
                'npx codexstorage --download <cid>'
            ));
            process.exit(1);
    }
}

async function downloadFile(cid = null) {
    if (platform === 'win32') {
        console.log(showInfoMessage('Coming soon for Windows!'));
        return;
    }

    const nodeRunning = await isNodeRunning();
    if (!nodeRunning) {
        console.log(showErrorMessage('Codex node is not running. Try again after starting the node'));
        return handleCommandLineOperation() ? process.exit(1) : showNavigationMenu();
    }

    let cidToDownload = cid;
    if (!cidToDownload) {
        const { inputCid } = await inquirer.prompt([
            {
                type: 'input',
                name: 'inputCid',
                message: 'Enter the CID:',
                validate: input => input.length > 0
            }
        ]);
        cidToDownload = inputCid;
    }

    try {
        const spinner = createSpinner('Downloading file').start();
        try {
            await runCommand(`curl "http://localhost:8080/api/codex/v1/data/${cidToDownload}/network/stream" -o "${cidToDownload}.png"`);
            spinner.success();
            console.log(showSuccessMessage(`Successfully downloaded!\n\nFile saved as ${cidToDownload}.png`));
        } catch (error) {
            spinner.error();
            throw new Error(`Failed to download: ${error.message}`);
        }
    } catch (error) {
        console.log(showErrorMessage(`Error downloading file: ${error.message}`));
    }

    return handleCommandLineOperation() ? process.exit(0) : showNavigationMenu();
}

async function showLocalFiles() {
    if (platform === 'win32') {
        console.log(showInfoMessage('Coming soon for Windows!'));
        return;
    }

    const nodeRunning = await isNodeRunning();
    if (!nodeRunning) {
        console.log(showErrorMessage('Codex node is not running. Try again after starting the node'));
        await showNavigationMenu();
        return;
    }

    try {
        const spinner = createSpinner('Fetching local files...').start();
        const filesResponse = await runCommand('curl http://localhost:8080/api/codex/v1/data -w \'\\n\'');
        spinner.success();

        // Parse the JSON response
        const filesData = JSON.parse(filesResponse);
        
        if (filesData.content && filesData.content.length > 0) {
            console.log(showInfoMessage(`Found ${filesData.content.length} local file(s)`));

            // Iterate through each file and display information
            filesData.content.forEach((file, index) => {
                const { cid, manifest } = file;
                const { rootHash, originalBytes, blockSize, protected: isProtected, filename, mimetype, uploadedAt } = manifest;

                // Convert the UNIX timestamp to a readable format
                const uploadedDate = new Date(uploadedAt * 1000).toLocaleString();
                const fileSize = (originalBytes / 1024).toFixed(2); // Convert to KB

                console.log(boxen(
                    `${chalk.cyan('File')} ${index + 1} of ${filesData.content.length}\n\n` +
                    `${chalk.cyan('Filename:')} ${filename}\n` +
                    `${chalk.cyan('CID:')} ${cid}\n` +
                    `${chalk.cyan('Size:')} ${fileSize} KB\n` +
                    `${chalk.cyan('MIME Type:')} ${mimetype}\n` +
                    `${chalk.cyan('Uploaded:')} ${uploadedDate}\n` +
                    `${chalk.cyan('Protected:')} ${isProtected ? chalk.green('Yes') : chalk.red('No')}`,
                    {
                        padding: 1,
                        margin: 1,
                        borderStyle: 'round',
                        borderColor: 'blue',
                        title: `📁 File Details`,
                        titleAlignment: 'center'
                    }
                ));
            });
        } else {
            console.log(showInfoMessage('No local files found.'));
        }
        await showNavigationMenu();
    } catch (error) {
        console.log(showErrorMessage(`Failed to show local files: ${error.message}`));
        await showNavigationMenu();
    }
}

async function uninstallCodex() {
    const binaryPath = '/usr/local/bin/codex';

    // Ask for confirmation
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: chalk.yellow('⚠️  Are you sure you want to uninstall Codex? This action cannot be undone.'),
            default: false
        }
    ]);

    if (!confirm) {
        console.log(showInfoMessage('Uninstall cancelled.'));
        await showNavigationMenu();
        return;
    }

    try {
        console.log(showInfoMessage(`Attempting to remove Codex binary from ${binaryPath}...`));
        await runCommand(`sudo rm ${binaryPath}`);
        console.log(showSuccessMessage('Codex has been successfully uninstalled.'));
        await showNavigationMenu();
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(showInfoMessage('Codex binary not found, nothing to uninstall.'));
        } else {
            console.log(showErrorMessage('Failed to uninstall Codex. Please make sure Codex is installed before trying to remove it.'));
        }
        await showNavigationMenu();
    }
}

// Add this function for cleanup and goodbye
function handleExit() {
    console.log(boxen(
        chalk.cyanBright('👋 Thank you for using Codex Storage CLI! Goodbye!'),
        {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            title: '👋 GOODBYE',
            titleAlignment: 'center'
        }
    ));
    process.exit(0);
}

// Add signal handlers at the start of main
async function main() {
    // Handle command line arguments
    const commandArgs = parseCommandLineArgs();
    if (commandArgs) {
        switch (commandArgs.command) {
            case 'upload':
                await uploadFile(commandArgs.value);
                return;
            case 'download':
                await downloadFile(commandArgs.value);
                return;
        }
    }

    // Handle exit signals
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    process.on('SIGQUIT', handleExit);
    
    try {
        while (true) {
            console.log('\n' + chalk.cyanBright(ASCII_ART));

            const { choice } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'choice',
                    message: 'Select an option:',
                    choices: [
                        '1. Download and install Codex',
                        '2. Run Codex node',
                        '3. Check node status',
                        '4. Upload a file',
                        '5. Download a file',
                        '6. Show local data',
                        '7. Uninstall Codex node',
                        '8. Exit'
                    ],
                    pageSize: 8,
                    loop: true
                }
            ]).catch(() => {
                handleExit();
                return { choice: '8' };
            });

            if (choice.startsWith('8')) {
                handleExit();
                break;
            }

            switch (choice.split('.')[0]) {
                case '1':
                    await checkCodexInstallation();
                    break;
                case '2':
                    await runCodex();
                    return;
                case '3':
                    await checkNodeStatus();
                    break;
                case '4':
                    await uploadFile();
                    break;
                case '5':
                    await downloadFile();
                    break;
                case '6':
                    await showLocalFiles();
                    break;
                case '7':
                    await uninstallCodex();
                    break;    
            }

            console.log('\n'); // Add some spacing between operations
        }
    } catch (error) {
        if (error.message.includes('ExitPromptError')) {
            handleExit();
        } else {
            console.error(chalk.red('An error occurred:', error.message));
            handleExit();
        }
    }
}

// Run the CLI
main().catch(console.error); 