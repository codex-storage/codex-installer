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
                        '2. Edit Codex configuration',
                        '3. Run Codex node',
                        '4. Check node status',
                        '5. Upload a file',
                        '6. Download a file',
                        '7. Show local data',
                        '8. Uninstall Codex node',
                        '9. Submit feedback',
                        '10. Exit'
                    ],
                    pageSize: 10,
                    loop: true
                }
            ]).catch(() => {
                handleExit();
                return;
            });
 
            switch (choice.split('.')[0]) {
                case '1':
                    await installCodex(config, showNavigationMenu);
                    break;
                case '2':
                    await showConfigMenu(config);
                    break;
                case '3':
                    await runCodex(config, showNavigationMenu);
                    return;
                case '4':
                    await checkNodeStatus(showNavigationMenu);
                    break;
                case '5':
                    await uploadFile(null, handleCommandLineOperation, showNavigationMenu);
                    break;
                case '6':
                    await downloadFile(null, handleCommandLineOperation, showNavigationMenu);
                    break;
                case '7':
                    await showLocalFiles(showNavigationMenu);
                    break;
                case '8':
                    await uninstallCodex(config, showNavigationMenu);
                    break;
                case '9':
                    const { exec } = await import('child_process');
                    const url = 'https://docs.google.com/forms/d/1U21xp6shfDkJWzJSKHhUjwIE7fsYk94gmLUKAbxUMcw/edit';
                    const command = process.platform === 'win32' ? `start ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
                    exec(command);
                    console.log(showInfoMessage('Opening feedback form in your browser...'));
                    break;
                case '10':
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