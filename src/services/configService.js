import {
  getAppDataDir,
  getCodexBinPath,
  getCodexConfigFilePath,
  getCodexDataDirDefaultPath,
  getCodexLogsDefaultPath,
} from "../utils/appData.js";

const defaultConfig = {
  codexExe: "",
  // User-selected config options:
  codexInstallPath: getCodexBinPath(),
  codexConfigFilePath: getCodexConfigFilePath(),
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
  constructor(fsService) {
    this.fs = fsService;
    this.loadConfig();
  }

  get = () => {
    return this.config;
  };

  loadConfig = () => {
    const filePath = this.getConfigFilename();
    try {
      if (!this.fs.isFile(filePath)) {
        this.config = defaultConfig;
        this.saveConfig();
      } else {
        this.config = this.fs.readJsonFile(filePath);
      }
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
      this.fs.writeJsonFile(filePath, this.config);
    } catch (error) {
      console.error(
        `Failed to save config file to '${filePath}' error: '${error}'.`,
      );
      throw error;
    }
  };

  getConfigFilename = () => {
    return this.fs.pathJoin([getAppDataDir(), "config.json"]);
  };

  getLogFilePath = () => {
    // function getCurrentLogFile(config) {
    //   const timestamp = new Date()
    //     .toISOString()
    //     .replaceAll(":", "-")
    //     .replaceAll(".", "-");
    //   return path.join(config.logsDir, `codex_${timestamp}.log`);
    // }
    // todo, maybe use timestamp

    return this.fs.pathJoin([this.config.logsDir, "codex.log"]);
  };

  writeCodexConfigFile = (publicIp, bootstrapNodes) => {
    const nl = "\n";
    const bootNodes = bootstrapNodes.map((v) => `"${v}"`).join(",");

    this.fs.writeFile(
      this.config.codexConfigFilePath,
      `data-dir="${this.format(this.config.dataDir)}"${nl}` +
        `log-level="DEBUG"${nl}` +
        `log-file="${this.format(this.getLogFilePath())}"${nl}` +
        `storage-quota=${this.config.storageQuota}${nl}` +
        `disc-port=${this.config.ports.discPort}${nl}` +
        `listen-addrs=["/ip4/0.0.0.0/tcp/${this.config.ports.listenPort}"]${nl}` +
        `api-port=${this.config.ports.apiPort}${nl}` +
        `nat="extip:${publicIp}"${nl}` +
        `api-cors-origin="*"${nl}` +
        `bootstrap-node=[${bootNodes}]`,
    );
  };

  format = (str) => {
    return str.replaceAll("\\", "/");
  };
}
