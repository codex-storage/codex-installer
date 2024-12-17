#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import { ASCII_ART } from './constants/ascii.js';
import { handleCommandLineOperation, parseCommandLineArgs } from './cli/commandParser.js';
import { uploadFile, downloadFile, showLocalFiles } from './handlers/fileHandlers.js';
import { checkCodexInstallation, installCodex, uninstallCodex } from './handlers/installationHandlers.js';
import { runCodex, checkNodeStatus } from './handlers/nodeHandlers.js';

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
                    await checkCodexInstallation(showNavigationMenu);
                    break;
                case '2':
                    await runCodex(showNavigationMenu);
                    return;
                case '3':
                    await checkNodeStatus(showNavigationMenu);
                    break;
                case '4':
                    await uploadFile(null, handleCommandLineOperation, showNavigationMenu);
                    break;
                case '5':
                    await downloadFile(null, handleCommandLineOperation, showNavigationMenu);
                    break;
                case '6':
                    await showLocalFiles(showNavigationMenu);
                    break;
                case '7':
                    await uninstallCodex(showNavigationMenu);
                    break;    
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