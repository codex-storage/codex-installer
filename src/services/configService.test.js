import { describe, beforeEach, it, expect, vi } from "vitest";
import { ConfigService } from "./configService.js";
import { mockFsService } from "../__mocks__/service.mocks.js";
import {
  getAppDataDir,
  getCodexBinPath,
  getCodexConfigFilePath,
  getCodexDataDirDefaultPath,
  getCodexLogsDefaultPath,
} from "../utils/appData.js";

describe("ConfigService", () => {
  const configPath = "/path/to/config.json";
  const expectedDefaultConfig = {
    codexExe: "",
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

  beforeEach(() => {
    vi.resetAllMocks();

    mockFsService.pathJoin.mockReturnValue(configPath);
  });

  describe("constructor", () => {
    it("formats the config file path", () => {
      new ConfigService(mockFsService);

      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        getAppDataDir(),
        "config.json",
      ]);
    });

    it("saves the default config when the config.json file does not exist", () => {
      mockFsService.isFile.mockReturnValue(false);

      const service = new ConfigService(mockFsService);

      expect(mockFsService.isFile).toHaveBeenCalledWith(configPath);
      expect(mockFsService.readJsonFile).not.toHaveBeenCalled();
      expect(mockFsService.writeJsonFile).toHaveBeenCalledWith(
        configPath,
        service.config,
      );
      expect(service.config).toEqual(expectedDefaultConfig);
    });

    it("loads the config.json file when it does exist", () => {
      mockFsService.isFile.mockReturnValue(true);
      const savedConfig = {
        isTestConfig: "Yes, very",
      };
      mockFsService.readJsonFile.mockReturnValue(savedConfig);

      const service = new ConfigService(mockFsService);

      expect(mockFsService.isFile).toHaveBeenCalledWith(configPath);
      expect(mockFsService.readJsonFile).toHaveBeenCalledWith(configPath);
      expect(mockFsService.writeJsonFile).not.toHaveBeenCalled();
      expect(service.config).toEqual(savedConfig);
    });
  });

  describe("getLogFilePath", () => {
    it("joins the logsDir with the log filename", () => {
      const service = new ConfigService(mockFsService);

      const result = "path/to/codex.log";
      mockFsService.pathJoin.mockReturnValue(result);

      expect(service.getLogFilePath()).toBe(result);
      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        expectedDefaultConfig.logsDir,
        "codex.log",
      ]);
    });
  });

  describe("validateConfiguration", () => {
    var configService;
    var config;

    beforeEach(() => {
      config = expectedDefaultConfig;
      
      configService = new ConfigService(mockFsService);
      configService.config = config;
    });

    it("throws when codexExe is not set", () => {
      config.codexExe = "";

      expect(configService.validateConfiguration).toThrow(
        "Missing config value: codexExe",
      );
    });

    
  });

  describe("writecodexConfigFile", () => {
    const logsPath = "C:\\path\\codex.log";
    var configService;

    beforeEach(() => {
      // use the default config:
      mockFsService.isFile.mockReturnValue(false);

      configService = new ConfigService(mockFsService);
      configService.validateConfiguration = vi.fn();
      configService.getLogFilePath = vi.fn();
      configService.getLogFilePath.mockReturnValue(logsPath);
    });

    function formatPath(str) {
      return str.replaceAll("\\", "/");
    }

    it("writes the config file values to the config TOML file", () => {
      const publicIp = "1.2.3.4";
      const bootstrapNodes = ["boot111", "boot222", "boot333"];

      configService.writeCodexConfigFile(publicIp, bootstrapNodes);

      const newLine = "\n";

      expect(mockFsService.writeFile).toHaveBeenCalledWith(
        expectedDefaultConfig.codexConfigFilePath,
        `data-dir=\"${formatPath(expectedDefaultConfig.dataDir)}"${newLine}` +
          `log-level="DEBUG"${newLine}` +
          `log-file="${formatPath(logsPath)}"${newLine}` +
          `storage-quota=${expectedDefaultConfig.storageQuota}${newLine}` +
          `disc-port=${expectedDefaultConfig.ports.discPort}${newLine}` +
          `listen-addrs=["/ip4/0.0.0.0/tcp/${expectedDefaultConfig.ports.listenPort}"]${newLine}` +
          `api-port=${expectedDefaultConfig.ports.apiPort}${newLine}` +
          `nat="extip:${publicIp}"${newLine}` +
          `api-cors-origin="*"${newLine}` +
          `bootstrap-node=[${bootstrapNodes
            .map((v) => {
              return '"' + v + '"';
            })
            .join(",")}]${newLine}`,
      );
    });
  });
});
