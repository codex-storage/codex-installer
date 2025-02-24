import fs from 'fs';
import path from 'path';
import { getAppDataDir } from '../utils/appdata.js';

const defaultConfig = {
  codexExe: "",
  
  // TODO:
  // Save user-selected config options. Use these when starting Codex.
  dataDir: "",
  logsDir: ""
  // storageQuota: 0,
  // ports: {
  //   discPort: 8090,
  //   listenPort: 8070,
  //   apiPort: 8080
  // }
};

function getConfigFilename() {
  return path.join(getAppDataDir(), "config.json");
}

export function saveConfig(config) {
  const filePath = getConfigFilename();
  try {
    fs.writeFileSync(filePath, JSON.stringify(config));
  } catch (error) {
    console.error(`Failed to save config file to '${filePath}' error: '${error}'.`);
    throw error;
  }
}

export function loadConfig() {
  const filePath = getConfigFilename();
  try {
    if (!fs.existsSync(filePath)) {
      saveConfig(defaultConfig);
      return defaultConfig;
    }
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    console.error(`Failed to load config file from '${filePath}' error: '${error}'.`);
    throw error;
  }
}
