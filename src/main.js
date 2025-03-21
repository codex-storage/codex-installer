#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import { ASCII_ART } from './constants/ascii.js';
import { handleCommandLineOperation, parseCommandLineArgs } from './cli/commandParser.js';
import { uploadFile, downloadFile, showLocalFiles } from './handlers/fileHandlers.js';
import { installCodex, uninstallCodex } from './handlers/installationHandlers.js';
import { runCodex, checkNodeStatus } from './handlers/nodeHandlers.js';
import { showInfoMessage } from './utils/messages.js';
import { loadConfig } from './services/config.js';
import { showConfigMenu } from './configmenu.js';
import { openCodexApp } from './services/codexapp.js';

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
            return main();
        case '2':
            handleExit();
    }
}

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

export async function main() {
    const commandArgs = parseCommandLineArgs();
    if (commandArgs) {
        switch (commandArgs.command) {
            case 'upload':
                await uploadFile(commandArgs.value, handleCommandLineOperation, showNavigationMenu);
                return;
            case 'download':
                await downloadFile(commandArgs.value, handleCommandLineOperation, showNavigationMenu);
                return;
        }
    }

    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    process.on('SIGQUIT', handleExit);
    
    try {
        const config = loadConfig();
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
                        '4. Edit Codex configuration',
                        '5. Open Codex App',
                        '6. Upload a file',
                        '7. Download a file',
                        '8. Show local data',
                        '9. Uninstall Codex node',
                        '10. Submit feedback',
                        '11. Exit'
                    ],
                    pageSize: 11,
                    loop: true
                }
            ]).catch(() => {
                handleExit();
                return;
            });
 
            switch (choice.split('.')[0]) {
                case '1':
                    const installed = await installCodex(config, showNavigationMenu);
                    if (installed) {
                        await showConfigMenu(config);
                    }
                    break;
                case '2':
                    await runCodex(config, showNavigationMenu);
                    return;
                case '3':
                    await checkNodeStatus(config, showNavigationMenu);
                    break;
                case '4':
                    await showConfigMenu(config);
                    break;
                case '5':
                    openCodexApp(config);
                    break;
                case '6':
                    await uploadFile(config, null, handleCommandLineOperation, showNavigationMenu);
                    break;
                case '7':
                    await downloadFile(config, null, handleCommandLineOperation, showNavigationMenu);
                    break;
                case '8':
                    await showLocalFiles(config, showNavigationMenu);
                    break;
                case '9':
                    await uninstallCodex(config, showNavigationMenu);
                    break;
                case '10':
                    const { exec } = await import('child_process');
                    const url = 'https://tally.so/r/w2DlXb';
                    const command = process.platform === 'win32' ? `start ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
                    exec(command);
                    console.log(showInfoMessage('Opening feedback form in your browser...'));
                    break;
                case '11':
                    handleExit();
                    return;
            }

            console.log('\n');
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