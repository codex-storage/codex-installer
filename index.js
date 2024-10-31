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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);
const platform = os.platform();

const ASCII_ART = `
██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗                  
██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝                  
██║     ██║   ██║██║  ██║█████╗   ╚███╔╝                   
██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗                   
╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗                  
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝                  
                                                           
███████╗████████╗ ██████╗ ██████╗  █████╗  ██████╗ ███████╗
██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝ ██╔════╝
███████╗   ██║   ██║   ██║██████╔╝███████║██║  ███╗█████╗  
╚════██║   ██║   ██║   ██║██╔══██╗██╔══██║██║   ██║██╔══╝  
███████║   ██║   ╚██████╔╝██║  ██║██║  ██║╚██████╔╝███████╗
╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝

+--------------------------------------------------------------------+
| Docs : docs.codex.storage   |   Discord : discord.gg/codex-storage |
+--------------------------------------------------------------------+
`;


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
            ]
        }
    ]);

    switch (choice.split('.')[0]) {
        case '1':
            return main(); // Returns to main menu
        case '2':
            console.log(chalk.cyanBright('\nGoodbye! 👋\n'));
            process.exit(0);
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

async function installCodex() { // TODO : TEST INSTALLATION TO SEE IF BACKGROUND SHELL WORKS CORRECTLY
    if (platform === 'win32') {
        console.log(chalk.yellow('Coming soon for Windows!'));
        return;
    }

    try {
        console.log(chalk.cyanBright('Downloading Codex binaries...'));
        const downloadCommand = 'curl -# -L https://get.codex.storage/install.sh | bash';
        await runCommand(downloadCommand);
        console.log(chalk.green('Codex binaries downloaded'));

        console.log(chalk.cyanBright('Installing dependencies...'));
        await runCommand('sudo apt update && sudo apt install libgomp1');
        console.log(chalk.green('Dependencies installed'));

        const version = await runCommand('codex --version');
        console.log(chalk.green('Codex is successfully installed. Version:'));
        console.log(chalk.cyanBright(version));
    } catch (error) {
        console.error(chalk.red('Failed to install Codex:', error.message));
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
    // Check if a Codex node is already running
    const nodeAlreadyRunning = await isNodeRunning();

    if (nodeAlreadyRunning) {
        console.log(chalk.green('A Codex node is already running.'));
        await showNavigationMenu();
    }
    else {
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

        console.log(chalk.cyanBright('\n\n Starting Codex node...'));
        console.log(chalk.cyanBright('\n Please keep this terminal open. Start a new terminal to start interacting with the node'));
        console.log(chalk.cyanBright('\n Press CTRL+C to stop the node'));
        await runCommand(command);
        // TODO : HANDLE THIS CHECKING PART
        const peerIdResponse = await runCommand('curl http://localhost:8080/api/codex/v1/peerid -w \'\\n\'');
        console.log(chalk.green('Codex node is successfully running. Peer ID:'));
        console.log(chalk.cyanBright(peerIdResponse.trim()));
        await showNavigationMenu();
    } catch (error) {
        console.error(chalk.red('Failed to run Codex:', error.message));
        await showNavigationMenu();
    }
}
}



async function checkNodeStatus() {
    if (platform === 'win32') {
        console.log(chalk.yellow('Coming soon for Windows!'));
        return;
    }

    try {
            // Check if a Codex node is already running
    const nodeRunning = await isNodeRunning();

    if (nodeRunning) {
        console.log(chalk.green('A Codex node is already running.'));
        await showNavigationMenu();
        const spinner = createSpinner('Checking node status...').start();
        const response = await runCommand('curl http://localhost:8080/api/codex/v1/debug/info -w \'\\n\'');
        spinner.success();
        
        // Parse the JSON response
        const data = JSON.parse(response);
        
        // Determine if node is online and discoverable based on the connected peers
        const peerCount = data.table.nodes.length;
        const isOnline = peerCount > 2;
        
        // Display node status based on connected peers
        const statusMessage = isOnline
        ? chalk.bgGreen(" Node status : ONLINE & DISCOVERABLE ")
        : chalk.bgRed(" Node status : OFFLINE ");
        const peerMessage = `Connected peers : ${peerCount}`;
        
        console.log('\n' + chalk.bold.cyanBright('📊 Node Status Summary'));
        console.log('━'.repeat(50));
        
        // Version Information
        console.log(chalk.bold.cyanBright('🔹 Version Info'));
        console.log(`   Version: ${data.codex.version}`);
        console.log(`   Revision: ${data.codex.revision}\n`);
        
        // Local Node Information
        console.log(chalk.bold.cyanBright('🔹 Local Node'));
        console.log(`   Node ID: ${data.table.localNode.nodeId}`);
        console.log(`   Peer ID: ${data.table.localNode.peerId}`);
        console.log(`   Listening Address: ${data.table.localNode.address}\n`);
        
        // Network Information
        console.log(chalk.bold.cyanBright('🔹 Network Status'));
        console.log(`   Public IP: ${data.announceAddresses[0].split('/')[2]}`);
        console.log(`   Port: ${data.announceAddresses[0].split('/')[4]}\n`);
        
        // Connected Peers Details
        if (peerCount > 0) {
            console.log(chalk.bold.cyanBright('🔹 Connected Peers'));
            data.table.nodes.forEach((node, index) => {
                console.log(`   ${index + 1}. Peer ${chalk.cyan(node.peerId)}`);
                console.log(`      Address: ${node.address}`);
                console.log(`      Status: ${node.seen ? chalk.green('Active') : chalk.gray('Inactive')}`);
                if (index < peerCount - 1) console.log(''); // Add spacing between peers
            });
        } else {
            console.log(chalk.red('No connected peers.'));
        }
        
        console.log('━'.repeat(50));
        await showNavigationMenu();
    }
    else{
        console.log(chalk.red('\nOops...Codex node is not running. Try again after starting the node in port 8080'));
        await showNavigationMenu();
    }
    } catch (error) {
        console.error(chalk.red('Failed to check node status:', error.message));
        await showNavigationMenu();
    }
}


async function uploadFile() {
    if (platform === 'win32') {
        console.log(chalk.yellow('Coming soon for Windows!'));
        return;
    }

    console.log(chalk.bgYellow('\n ⚠️  Warning: Codex does not encrypt files. Anything uploaded will be available publicly on testnet. The testnet does not provide any guarentees - please do not use in production ⚠️ \n'));

    const { filePath } = await inquirer.prompt([
        {
            type: 'input',
            name: 'filePath',
            message: 'Enter the file path to upload:',
            validate: input => input.length > 0
        }
        
    ]);

    try {
        const spinner = createSpinner('Uploading file').start();
        // TODO : Upload along with metadata like file name, extension etc.,
        const result = await runCommand(`curl -X POST http://localhost:8080/api/codex/v1/data -H 'Content-Type: application/octet-stream' -w '\\n' -T ${filePath}`);
        spinner.success();
        console.log(chalk.green('Successfully uploaded!'));
        console.log(chalk.bgGreen('\nCID:', result.trim()));
        await showNavigationMenu();
    } catch (error) {
        console.error(chalk.red('Failed to upload file:', error.message));
        await showNavigationMenu();
    }
}

async function downloadFile() {
    if (platform === 'win32') {
        console.log(chalk.yellow('Coming soon for Windows!'));
        return;
    }

    const { cid } = await inquirer.prompt([
        {
            type: 'input',
            name: 'cid',
            message: 'Enter the CID:',
            validate: input => input.length > 0
        }
    ]);

    try {
        const spinner = createSpinner('Downloading file').start();
        await runCommand(`curl "http://localhost:8080/api/codex/v1/data/${cid}/network/stream" -o "${cid}.png"`);
        spinner.success();
        console.log(chalk.green(`Successfully downloaded!`));
        console.log(chalk.bgGreen(`\nFile saved as ${cid}.png`));
        await showNavigationMenu();
    } catch (error) {
        console.error(chalk.red('Failed to download file:', error.message));
        await showNavigationMenu();
    }
}

async function showLocalFiles() {
    if (platform === 'win32') {
        console.log(chalk.yellow('Coming soon for Windows!'));
        return;
    }

    try {
        const spinner = createSpinner('Fetching local files...').start();
        const filesResponse = await runCommand('curl http://localhost:8080/api/codex/v1/data -w \'\\n\'');
        spinner.success();

        // Parse the JSON response
        const filesData = JSON.parse(filesResponse);
        
        if (filesData.content && filesData.content.length > 0) {
            console.log(chalk.cyanBright('\nLocal Files:'));
            console.log('━'.repeat(50));

            // Iterate through each file and display information
            filesData.content.forEach((file, index) => {
                const { cid, manifest } = file;
                const { rootHash, originalBytes, blockSize, protected: isProtected, filename, mimetype, uploadedAt } = manifest;

                // Convert the UNIX timestamp to a readable format
                const uploadedDate = new Date(uploadedAt * 1000).toLocaleString();

                console.log(`📁 File ${index + 1}:`);
                console.log(`   Filename       : ${chalk.green(filename)}`);
                console.log(`   CID            : ${chalk.cyan(cid)}`);
                console.log(`   Root Hash      : ${chalk.cyan(rootHash)}`);
                console.log(`   Original Bytes : ${chalk.yellow(originalBytes)}`);
                console.log(`   Block Size     : ${chalk.yellow(blockSize)}`);
                console.log(`   Protected      : ${chalk.yellow(isProtected ? 'Yes' : 'No')}`);
                console.log(`   MIME Type      : ${chalk.green(mimetype)}`);
                console.log(`   Uploaded At    : ${chalk.magenta(uploadedDate)}`);
                console.log('━'.repeat(50));                
            });
            await showNavigationMenu();

        } else {
            console.log(chalk.red('No local files found.'));
            await showNavigationMenu();
        }
    } catch (error) {
        console.error(chalk.red('Failed to show local files:', error.message));
        await showNavigationMenu();
    }
}


async function main() {
    
    while (true) {
        console.log('\n' + chalk.cyanBright(ASCII_ART));

        const { choice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'choice',
                message: 'Select an option:',
                choices: [
                    '1. Install Codex node',
                    '2. Run Codex node',
                    '3. Check node status',
                    '4. Upload a file',
                    '5. Download a file',
                    '6. Show local data',
                    '7. Exit'
                ]
            }
        ]);

        if (choice.startsWith('7.')) {
            console.log(chalk.cyanBright('\nGoodbye! 👋\n'));
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
        }

        console.log('\n'); // Add some spacing between operations
    }
}

// Run the CLI
main().catch(console.error); 