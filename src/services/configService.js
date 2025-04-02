import fs from "fs";
import path from "path";
import { getAppDataDir } from "../utils/appDataa.js";
import {
  getCodexBinPath,
  getCodexDataDirDefaultPath,
  getCodexLogsDefaultPath,
} from "../utils/appDataa.js";

const defaultConfig = {
  codexExe: "",
  // User-selected config options:
  codexPath: getCodexBinPath(),
  dataDir: getCodexDataDirDefaultPath(),
  logsDir: getCodexLogsDefaultPath(),
  storageQuota: 8 * 1024 * 1024 * 1024,
  ports: {
    discPort: 8090,
    listenPort: 8070,
    apiPort: 8080,
  },
};

export class ConfigService {
  constructor() {
    this.loadConfig();
  }

  get = () => {
    return this.config;
  };

  loadConfig = () => {
    const filePath = this.getConfigFilename();
    try {
      if (!fs.existsSync(filePath)) {
        this.config = defaultConfig;
        this.saveConfig();
      }
      this.config = JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      console.error(
        `Failed to load config file from '${filePath}' error: '${error}'.`,
      );
      throw error;
    }
  };

  saveConfig = () => {
    const filePath = this.getConfigFilename();
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.config));
    } catch (error) {
      console.error(
        `Failed to save config file to '${filePath}' error: '${error}'.`,
      );
      throw error;
    }
  };

  getConfigFilename = () => {
    return path.join(getAppDataDir(), "config.json");
  };
}
