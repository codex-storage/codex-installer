import { describe, beforeEach, it, expect, vi } from "vitest";
import { ConfigService } from "./configService.js";
import { mockFsService, mockOsService } from "../__mocks__/service.mocks.js";
import { getAppDataDir, getDefaultCodexRootPath } from "../utils/appData.js";

function getDefaultConfig() {
  return {
    codexRoot: getDefaultCodexRootPath(),
    storageQuota: 8 * 1024 * 1024 * 1024,
    ports: {
      discPort: 8090,
      listenPort: 8070,
      apiPort: 8080,
    },
  };
}

describe("ConfigService", () => {
  const configPath = "/path/to/config.json";
  var expectedDefaultConfig = getDefaultConfig();

  beforeEach(() => {
    vi.resetAllMocks();
    expectedDefaultConfig = getDefaultConfig();

    mockFsService.pathJoin.mockReturnValue(configPath);
  });

  describe("constructor", () => {
    it("formats the config file path", () => {
      new ConfigService(mockFsService, mockOsService);

      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        getAppDataDir(),
        "config.json",
      ]);
    });

    it("saves the default config when the config.json file does not exist", () => {
      mockFsService.isFile.mockReturnValue(false);

      const service = new ConfigService(mockFsService, mockOsService);

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
        codexRoot: "defined",
        isTestConfig: "Yes, very",
      };
      mockFsService.readJsonFile.mockReturnValue(savedConfig);

      const service = new ConfigService(mockFsService, mockOsService);

      expect(mockFsService.isFile).toHaveBeenCalledWith(configPath);
      expect(mockFsService.readJsonFile).toHaveBeenCalledWith(configPath);
      expect(mockFsService.writeJsonFile).not.toHaveBeenCalled();
      expect(service.config).toEqual(savedConfig);
    });

    it("saves the default config when config.json exists but doesn't define the codexRoot", () => {
      mockFsService.isFile.mockReturnValue(true);
      const savedConfig = {
        codexRoot: undefined, // it still blows my mind we have a language in which we can define things to be undefined.
        isTestConfig: "Yes, very",
      };
      mockFsService.readJsonFile.mockReturnValue(savedConfig);

      const service = new ConfigService(mockFsService, mockOsService);

      expect(mockFsService.isFile).toHaveBeenCalledWith(configPath);
      expect(mockFsService.readJsonFile).toHaveBeenCalledWith(configPath);
      expect(mockFsService.writeJsonFile).toHaveBeenCalled();
      expect(service.config).toEqual(expectedDefaultConfig);
    });
  });

  describe("getCodexExe", () => {
    var configService;
    const result = "path/to/codex";

    beforeEach(() => {
      mockFsService.isFile.mockReturnValue(false);
      mockFsService.pathJoin.mockReturnValue(result);
      configService = new ConfigService(mockFsService, mockOsService);
    });

    it("joins the codex root with the non-Windows specific exe name", () => {
      mockOsService.isWindows.mockReturnValue(false);

      expect(configService.getCodexExe()).toBe(result);
      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        expectedDefaultConfig.codexRoot,
        "codex",
      ]);
    });

    it("joins the codex root with the Windows specific exe name", () => {
      mockOsService.isWindows.mockReturnValue(true);

      expect(configService.getCodexExe()).toBe(result);
      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        expectedDefaultConfig.codexRoot,
        "codex.exe",
      ]);
    });
  });

  describe("getCodexConfigFilePath", () => {
    const result = "path/to/codex";

    it("joins the codex root and codexConfigFile", () => {
      mockFsService.pathJoin.mockReturnValue(result);
      const configService = new ConfigService(mockFsService, mockOsService);

      expect(configService.getCodexConfigFilePath()).toBe(result);
      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        expectedDefaultConfig.codexRoot,
        "config.toml",
      ]);
    });
  });

  describe("getEthFilePaths", () => {
    const result1 = "path/to/key";
    const result2 = "path/to/address";

    it("returns the key and address file paths", () => {
      const configService = new ConfigService(mockFsService, mockOsService);

      mockFsService.pathJoin = vi.fn();
      mockFsService.pathJoin.mockReturnValueOnce(result1);
      mockFsService.pathJoin.mockReturnValueOnce(result2);

      expect(configService.getEthFilePaths()).toEqual({
        key: result1,
        address: result2,
      });

      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        expectedDefaultConfig.codexRoot,
        "eth.key",
      ]);
      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        expectedDefaultConfig.codexRoot,
        "eth.address",
      ]);
    });
  });

  describe("validateConfiguration", () => {
    var configService;
    var config;

    beforeEach(() => {
      config = expectedDefaultConfig;
      config.codexExe = "codex.exe";

      configService = new ConfigService(mockFsService, mockOsService);
      configService.config = config;
    });

    it("throws when storageQuota is less than 100 MB", () => {
      config.storageQuota = 1024 * 1024 * 99;

      expect(configService.validateConfiguration).toThrow(
        "Storage quota must be at least 100MB",
      );
    });

    it("passes validation for default config when codexExe is set", () => {
      expect(configService.validateConfiguration).not.toThrow();
    });
  });

  describe("writeCodexConfigFile", () => {
    const logsPath = "C:\\path\\codex.log";
    var configService;

    beforeEach(() => {
      // use the default config:
      mockFsService.isFile.mockReturnValue(false);

      configService = new ConfigService(mockFsService, mockOsService);
      configService.validateConfiguration = vi.fn();
      configService.getLogFilePath = vi.fn();
      configService.getLogFilePath.mockReturnValue(logsPath);
    });

    it("writes the config file values to the config TOML file", () => {
      const publicIp = "1.2.3.4";
      const bootstrapNodes = ["boot111", "boot222", "boot333"];
      const expectedDataDir = "datadir";
      const expectedLogFile = "codex.log";
      const codexConfigFilePath = "/path/to/config.toml";

      configService.getCodexConfigFilePath = vi.fn();
      configService.getCodexConfigFilePath.mockReturnValue(codexConfigFilePath);

      configService.writeCodexConfigFile(publicIp, bootstrapNodes);

      const newLine = "\n";

      expect(mockFsService.writeFile).toHaveBeenCalledWith(
        codexConfigFilePath,
        `data-dir=\"${expectedDataDir}"${newLine}` +
          `log-level="DEBUG"${newLine}` +
          `log-file="${expectedLogFile}"${newLine}` +
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
