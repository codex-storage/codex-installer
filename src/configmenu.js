import inquirer from 'inquirer';
import chalk from 'chalk';
import { showErrorMessage, showInfoMessage } from './utils/messages.js';
import { isDir, showPathSelector } from './utils/pathSelector.js';
import { saveConfig } from './services/config.js';
import { showNumberSelector } from './utils/numberSelector.js';
import fs from 'fs-extra';

function bytesAmountToString(numBytes) {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  var value = numBytes;
  var index = 0;
  while (value > 1024) {
    index = index + 1;
    value = value / 1024;
  }

  if (index == 0) return `${numBytes} Bytes`;
  return `${numBytes} Bytes (${value} ${units[index]})`;
}

async function showStorageQuotaSelector(config) {
  console.log(showInfoMessage('You can use: "GB" or "gb", etc.'));
  const result = await showNumberSelector(config.storageQuota, "Storage quota", true);
  if (result < (100 * 1024 * 1024)) {
    console.log(showErrorMessage("Storage quote should be >= 100mb."));
    return config.storageQuota;
  }
  return result;
}

export async function showConfigMenu(config) {
    var newDataDir = config.dataDir;
    try {
        while (true) {
            console.log(showInfoMessage("Codex Configuration"));
            const { choice } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'choice',
                    message: 'Select to edit:',
                    choices: [
                        `1. Data path = "${newDataDir}"`,
                        `2. Logs path = "${config.logsDir}"`,
                        `3. Storage quota = ${bytesAmountToString(config.storageQuota)}`,
                        '4. Discovery port = TODO',
                        '5. P2P listen port = TODO',
                        '6. API port = TODO',
                        '7. Save changes and exit',
                        '8. Discard changes and exit'
                    ],
                    pageSize: 8,
                    loop: true
                }
            ]).catch(() => {
                return;
            });

            switch (choice.split('.')[0]) {
                case '1':
                    newDataDir = await showPathSelector(config.dataDir, false);
                    if (isDir(newDataDir)) {
                      console.log(showInfoMessage("Warning: The new data path already exists. Make sure you know what you're doing."));
                    }
                    break;
                case '2':
                    config.logsDir = await showPathSelector(config.logsDir, true);
                    break;
                case '3':
                    config.storageQuota = await showStorageQuotaSelector(config);
                    break;
                case '4':
                    break;
                case '5':
                    break;
                case '6':
                    break;
                case '7':
                    // save changes, back to main menu
                    config = updateDataDir(config, newDataDir);
                    saveConfig(config);
                    return;
                case '8':
                    // discard changes, back to main menu
                    return;
            }
        }
    } catch (error) {
        console.error(chalk.red('An error occurred:', error.message));
        return;
    }
}

function updateDataDir(config, newDataDir) {
  if (config.dataDir == newDataDir) return config;

  // The Codex dataDir is a little strange:
  // If the old one is empty: The new one should not exist, so that codex creates it
  // with the correct security permissions.
  // If the old one does exist: We move it.

  if (isDir(config.dataDir)) {
    console.log(showInfoMessage(
      'Moving Codex data folder...\n' +
      `From: "${config.dataDir}"\n` +
      `To: "${newDataDir}"`
    ));

    try {
      fs.moveSync(config.dataDir, newDataDir);
    } catch (error) {
      console.log(showErrorMessage("Error while moving dataDir: " + error.message));
      throw error;
    }
  } else {
    // Old data dir does not exist.
    if (isDir(newDataDir)) {
      console.log(showInfoMessage(
        "Warning: the selected data path already exists.\n" +
        `New data path = "${newDataDir}"\n` +
        "Codex may overwrite data in this folder.\n" +
        "Codex will fail to start if this folder does not have the required\n" +
        "security permissions."
      ));
    }
  }

  config.dataDir = newDataDir;
  return config;
}
