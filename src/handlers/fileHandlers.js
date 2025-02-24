import { createSpinner } from 'nanospinner';
import { runCommand } from '../utils/command.js';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '../utils/messages.js';
import { isNodeRunning } from '../services/nodeService.js';
import fs from 'fs/promises';
import boxen from 'boxen';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import mime from 'mime-types';
import axios from 'axios';

export async function uploadFile(config, filePath = null, handleCommandLineOperation, showNavigationMenu) {
    const nodeRunning = await isNodeRunning(config);
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
        await fs.access(fileToUpload);
        
        const filename = path.basename(fileToUpload);
        const contentType = mime.lookup(fileToUpload) || 'application/octet-stream';
        
        const spinner = createSpinner('Uploading file').start();
        try {
            const result = await runCommand(
                `curl -X POST http://localhost:${config.ports.apiPort}/api/codex/v1/data ` +
                `-H 'Content-Type: ${contentType}' ` +
                `-H 'Content-Disposition: attachment; filename="${filename}"' ` +
                `-w '\\n' -T "${fileToUpload}"`
            );
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

export async function downloadFile(config, cid = null, handleCommandLineOperation, showNavigationMenu) {
    const nodeRunning = await isNodeRunning(config);
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
        const spinner = createSpinner('Fetching file metadata...').start();
        try {
            // First, get the file metadata
            const metadataResponse = await axios.post(`http://localhost:${config.ports.apiPort}/api/codex/v1/data/${cidToDownload}/network`);
            const { manifest } = metadataResponse.data;
            const { filename, mimetype } = manifest;

            spinner.success();
            spinner.start('Downloading file...');

            // Then download the file with the correct filename
            await runCommand(`curl "http://localhost:${config.ports.apiPort}/api/codex/v1/data/${cidToDownload}/network/stream" -o "${filename}"`);
            
            spinner.success();
            console.log(showSuccessMessage(
                'Successfully downloaded!\n\n' +
                `Filename: ${filename}\n` +
                `Type: ${mimetype}`
            ));

            // Show file details
            console.log(boxen(
                `${chalk.cyan('File Details')}\n\n` +
                `${chalk.cyan('Filename:')} ${filename}\n` +
                `${chalk.cyan('MIME Type:')} ${mimetype}\n` +
                `${chalk.cyan('CID:')} ${cidToDownload}\n` +
                `${chalk.cyan('Protected:')} ${manifest.protected ? chalk.green('Yes') : chalk.red('No')}\n` +
                `${chalk.cyan('Uploaded:')} ${new Date(manifest.uploadedAt * 1000).toLocaleString()}`,
                {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'blue',
                    title: '📁 Download Complete',
                    titleAlignment: 'center'
                }
            ));
        } catch (error) {
            spinner.error();
            if (error.response) {
                throw new Error(`Failed to download: ${error.response.data.message || 'File not found'}`);
            } else {
                throw new Error(`Failed to download: ${error.message}`);
            }
        }
    } catch (error) {
        console.log(showErrorMessage(`Error downloading file: ${error.message}`));
    }

    return handleCommandLineOperation() ? process.exit(0) : showNavigationMenu();
}

export async function showLocalFiles(config, showNavigationMenu) {
    const nodeRunning = await isNodeRunning(config);
    if (!nodeRunning) {
        console.log(showErrorMessage('Codex node is not running. Try again after starting the node'));
        await showNavigationMenu();
        return;
    }

    try {
        const spinner = createSpinner('Fetching local files...').start();
        const filesResponse = await axios.get(`http://localhost:${config.ports.apiPort}/api/codex/v1/data`);
        const filesData = filesResponse.data;
        spinner.success();

        if (filesData.content && filesData.content.length > 0) {
            console.log(showInfoMessage(`Found ${filesData.content.length} local file(s)`));

            filesData.content.forEach((file, index) => {
                const { cid, manifest } = file;
                const { rootHash, originalBytes, blockSize, protected: isProtected, filename, mimetype, uploadedAt } = manifest;

                const uploadedDate = new Date(uploadedAt * 1000).toLocaleString();
                const fileSize = (originalBytes / 1024).toFixed(2);

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
            console.log(showInfoMessage("Node contains no datasets."));
        }
    } catch (error) {
        console.log(showErrorMessage(`Failed to fetch local files: ${error.message}`));
    }

    await showNavigationMenu();
} 