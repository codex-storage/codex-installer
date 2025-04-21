import { getAppDataDir, getDefaultCodexRootPath } from "../utils/appData.js";

const defaultConfig = {
  codexRoot: getDefaultCodexRootPath(),
  storageQuota: 8 * 1024 * 1024 * 1024,
  ports: {
    discPort: 8090,
    listenPort: 8070,
    apiPort: 8080,
  },
};

const datadir = "datadir";
const codexLogFile = "codex.log";
const codexConfigFile = "config.toml";

export class ConfigService {
  constructor(fsService, osService) {
    this.fs = fsService;
    this.os = osService;
    this.loadConfig();
  }

  get = () => {
    return this.config;
  };

  getCodexExe = () => {
    var codexExe = "codex";
    if (this.os.isWindows()) {
      codexExe = "codex.exe";
    }

    return this.fs.pathJoin([this.config.codexRoot, codexExe]);
  };

  getCodexConfigFilePath = () => {
    return this.fs.pathJoin([this.config.codexRoot, codexConfigFile]);
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

  validateConfiguration = () => {
    if (this.config.storageQuota < 1024 * 1024 * 100)
      throw new Error("Storage quota must be at least 100MB");
  };

  writeCodexConfigFile = (publicIp, bootstrapNodes) => {
    this.validateConfiguration();

    const nl = "\n";
    const bootNodes = bootstrapNodes.map((v) => `"${v}"`).join(",");

    this.fs.writeFile(
      this.getCodexConfigFilePath(),
      `data-dir="${datadir}"${nl}` +
        `log-level="DEBUG"${nl}` +
        `log-file="${codexLogFile}"${nl}` +
        `storage-quota=${this.config.storageQuota}${nl}` +
        `disc-port=${this.config.ports.discPort}${nl}` +
        `listen-addrs=["/ip4/0.0.0.0/tcp/${this.config.ports.listenPort}"]${nl}` +
        `api-port=${this.config.ports.apiPort}${nl}` +
        `nat="extip:${publicIp}"${nl}` +
        `api-cors-origin="*"${nl}` +
        `bootstrap-node=[${bootNodes}]${nl}`,
    );
  };
}
