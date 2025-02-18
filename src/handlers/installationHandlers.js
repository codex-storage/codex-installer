import path from 'path';
import inquirer from 'inquirer';
import boxen from 'boxen';
import chalk from 'chalk';
import os from 'os';
import fs from 'fs';
import { createSpinner } from 'nanospinner';
import { runCommand } from '../utils/command.js';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '../utils/messages.js';
import { checkDependencies } from '../services/nodeService.js';
import { saveConfig } from '../services/config.js';
import { getCodexInstallPath, getCodexDataDirDefaultPath, getCodexLogsPath } from '../utils/appdata.js';

const platform = os.platform();

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

export async function getCodexVersion(config) {
    if (config.codexExe.length < 1) return "";

    try {
        const version = await runCommand(`${config.codexExe} --version`);
        if (version.length < 1) throw new Error("Version info not found.");
        return version;
    } catch (error) {
        return "";
    }
}

export async function checkCodexInstallation(config, showNavigationMenu) {
    const version = await getCodexVersion(config);

    if (version.length > 0) {
        console.log(chalk.green('Codex is already installed. Version:'));
        console.log(chalk.green(version));
        await showNavigationMenu();
    } else {
        console.log(chalk.cyanBright('Codex is not installed, proceeding with installation...'));
        await installCodex(config, showNavigationMenu);
    }
}

async function saveCodexExePathToConfig(config, codexExePath) {
    config.codexExe = codexExePath;
    config.dataDir = getCodexDataDirDefaultPath();
    config.logsDir = getCodexLogsPath();
    if (!fs.existsSync(config.codexExe)) {
        console.log(showErrorMessage(`Codex executable not found in expected path: ${config.codexExe}`));
        throw new Error("Exe not found");
    }
    if (await getCodexVersion(config).length < 1) {
        console.log(showInfoMessage("no"));
        throw new Error(`Codex not found at path after install. Path: '${config.codexExe}'`);
    }
    saveConfig(config);
}

export async function installCodex(config, showNavigationMenu) {
    const agreed = await showPrivacyDisclaimer();
    if (!agreed) {
        console.log(showInfoMessage('You can find manual setup instructions at docs.codex.storage'));
        process.exit(0);
        return;
    }

    const installPath = getCodexInstallPath();
    console.log(showInfoMessage("Install location: " + installPath));

    const spinner = createSpinner('Installing Codex...').start();

    try {
        
        if (platform === 'win32') {
            try {
                try {
                    await runCommand('curl --version');
                } catch (error) {
                    throw new Error('curl is not available. Please install curl or update your Windows version.');
                }

                await runCommand('curl -LO --ssl-no-revoke https://get.codex.storage/install.cmd');
                await runCommand(`set "INSTALL_DIR=${installPath}" && "${process.cwd()}\\install.cmd"`);
                
                await saveCodexExePathToConfig(config, path.join(installPath, "codex.exe"));

                try {
                    await runCommand('del /f install.cmd');
                } catch (error) {
                    // Ignore cleanup errors
                }
            } catch (error) {
                if (error.message.includes('Access is denied')) {
                    throw new Error('Installation failed. Please run the command prompt as Administrator and try again.');
                } else if (error.message.includes('curl')) {
                    throw new Error(error.message);
                } else {
                    throw new Error(`Installation failed: "${error.message}"`);
                }
            }
        } else {
            try {
                const dependenciesInstalled = await checkDependencies();
                if (!dependenciesInstalled) {
                    console.log(showInfoMessage('Please install the required dependencies and try again.'));
                    throw new Error("Missing dependencies.");
                }

                const downloadCommand = 'curl -# --connect-timeout 10 --max-time 60 -L https://get.codex.storage/install.sh -o install.sh && chmod +x install.sh';
                await runCommand(downloadCommand);
                
                if (platform === 'darwin') {
                    const timeoutCommand = `perl -e '
                        eval {
                            local $SIG{ALRM} = sub { die "timeout\\n" };
                            alarm(120);
                            system("INSTALL_DIR="${installPath}" bash install.sh");
                            alarm(0);
                        };
                        die if $@;
                    '`;
                    await runCommand(timeoutCommand);
                } else {
                    await runCommand(`INSTALL_DIR="${installPath}" timeout 120 bash install.sh`);
                }

                await saveCodexExePathToConfig(config, path.join(installPath, "codex"));
                
            } catch (error) {
                if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
                    throw new Error('Installation failed. Please check your internet connection and try again.');
                } else if (error.message.includes('Permission denied')) {
                    throw new Error('Permission denied. Please try running the command with sudo.');
                } else if (error.message.includes('timeout')) {
                    throw new Error('Installation is taking longer than expected. Please try running with sudo.');
                } else {
                    throw new Error('Installation failed. Please try running with sudo if you haven\'t already.');
                }
            } finally {
                await runCommand('rm -f install.sh').catch(() => {});
            }
        }
        
        try {
            const version = await getCodexVersion(config);
            console.log(showSuccessMessage(
                'Codex is successfully installed!\n' +
                `Install path: "${config.codexExe}"\n\n` +
                `Version: ${version}`
            ));
        } catch (error) {
            throw new Error('Installation completed but Codex command is not available. Please restart your terminal and try again.');
        }
        
        spinner.success();
        await showNavigationMenu();
    } catch (error) {
        spinner.error();
        console.log(showErrorMessage(`Failed to install Codex: ${error.message}`));
        await showNavigationMenu();
    }
}

export async function uninstallCodex(showNavigationMenu) {
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
        if (platform === 'win32') {
            console.log(showInfoMessage('Removing Codex from Windows...'));
            
            await runCommand('netsh advfirewall firewall delete rule name="Allow Codex (TCP-In)"');
            await runCommand('netsh advfirewall firewall delete rule name="Allow Codex (UDP-In)"');
            
            await runCommand('rd /s /q "%LOCALAPPDATA%\\Codex"');
            
            console.log(showInfoMessage(
                'To complete uninstallation:\n\n' +
                '1. Open Control Panel → System → Advanced System settings → Environment Variables\n' +
                '2. Or type "environment variables" in Windows Search\n' +
                '3. Remove "%LOCALAPPDATA%\\Codex" from your Path variable'
            ));
        } else {
            const binaryPath = '/usr/local/bin/codex';
            console.log(showInfoMessage(`Attempting to remove Codex binary from ${binaryPath}...`));
            await runCommand(`sudo rm ${binaryPath}`);
        }
        
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
