import { describe, beforeEach, it, expect, vi } from "vitest";
import { ConfigMenu } from "./configMenu.js";
import { mockUiService } from "../__mocks__/service.mocks.js";
import { mockConfigService } from "../__mocks__/service.mocks.js";
import {
  mockPathSelector,
  mockNumberSelector,
  mockMenuLoop,
  mockDataDirMover,
} from "../__mocks__/utils.mocks.js";

describe("ConfigMenu", () => {
  const config = {
    dataDir: "/data",
    logsDir: "/logs",
    storageQuota: 1024 * 1024 * 1024,
    ports: {
      discPort: 8090,
      listenPort: 8070,
      apiPort: 8080,
    },
  };
  let configMenu;

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfigService.get.mockReturnValue(config);

    configMenu = new ConfigMenu(
      mockUiService,
      mockMenuLoop,
      mockConfigService,
      mockPathSelector,
      mockNumberSelector,
      mockDataDirMover,
    );
  });

  it("initializes the loop with the config menu", () => {
    expect(mockMenuLoop.initialize).toHaveBeenCalledWith(
      configMenu.showConfigMenu,
    );
  });

  it("shows the config menu header", async () => {
    await configMenu.show();
    expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
      "Codex Configuration",
    );
  });

  it("starts the menu loop", async () => {
    await configMenu.show();
    expect(mockMenuLoop.showLoop).toHaveBeenCalled();
  });

  it("sets the config field", async () => {
    await configMenu.show();
    expect(configMenu.config).toEqual(config);
  });

  it("sets the original datadir field", async () => {
    await configMenu.show();
    expect(configMenu.originalDataDir).toEqual(config.dataDir);
  });

  describe("config menu options", () => {
    beforeEach(() => {
      configMenu.config = config;
    });

    it("displays the configuration menu", async () => {
      await configMenu.showConfigMenu();
      expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
        "Select to edit:",
        [
          {
            label: `Data path = "${mockConfigService.get().dataDir}"`,
            action: configMenu.editDataDir,
          },
          {
            label: `Logs path = "${mockConfigService.get().logsDir}"`,
            action: configMenu.editLogsDir,
          },
          {
            label: `Storage quota = 1073741824 Bytes (1024 MB)`,
            action: configMenu.editStorageQuota,
          },
          {
            label: `Discovery port = ${mockConfigService.get().ports.discPort}`,
            action: configMenu.editDiscPort,
          },
          {
            label: `P2P listen port = ${mockConfigService.get().ports.listenPort}`,
            action: configMenu.editListenPort,
          },
          {
            label: `API port = ${mockConfigService.get().ports.apiPort}`,
            action: configMenu.editApiPort,
          },
          {
            label: "Save changes and exit",
            action: configMenu.saveChangesAndExit,
          },
          {
            label: "Discard changes and exit",
            action: configMenu.discardChangesAndExit,
          },
        ],
      );
    });

    it("edits the logs directory", async () => {
      const originalPath = config.dataDir;
      mockPathSelector.show.mockResolvedValue("/new-data");
      await configMenu.editDataDir();

      expect(mockPathSelector.show).toHaveBeenCalledWith(originalPath, false);
      expect(configMenu.config.dataDir).toEqual("/new-data");
    });

    it("edits the logs directory", async () => {
      const originalPath = config.logsDir;
      mockPathSelector.show.mockResolvedValue("/new-logs");
      await configMenu.editLogsDir();

      expect(mockPathSelector.show).toHaveBeenCalledWith(originalPath, true);
      expect(configMenu.config.logsDir).toEqual("/new-logs");
    });

    it("edits the storage quota", async () => {
      const originalQuota = config.storageQuota;
      const newQuota = 200 * 1024 * 1024;
      mockNumberSelector.show.mockResolvedValue(newQuota);

      await configMenu.editStorageQuota();

      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        "You can use: 'GB' or 'gb', etc.",
      );
      expect(mockNumberSelector.show).toHaveBeenCalledWith(
        originalQuota,
        "Storage quota",
        true,
      );
      expect(configMenu.config.storageQuota).toEqual(newQuota);
    });

    it("shows an error if storage quota is too small", async () => {
      const originalQuota = config.storageQuota;
      mockNumberSelector.show.mockResolvedValue(50 * 1024 * 1024);

      await configMenu.editStorageQuota();

      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
        "Storage quote should be >= 100mb.",
      );
      expect(configMenu.config.storageQuota).toEqual(originalQuota);
    });

    it("edits the discovery port", async () => {
      const originalPort = config.ports.discPort;
      const newPort = 9000;
      mockNumberSelector.show.mockResolvedValue(newPort);

      await configMenu.editDiscPort();

      expect(mockNumberSelector.show).toHaveBeenCalledWith(
        originalPort,
        "Discovery port",
        false,
      );
      expect(configMenu.config.ports.discPort).toEqual(newPort);
    });

    it("shows an error if discovery port is out of range", async () => {
      const originalPort = config.ports.discPort;
      mockNumberSelector.show.mockResolvedValue(1000);
      await configMenu.editDiscPort();

      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
        "Port should be between 1024 and 65535.",
      );
      expect(configMenu.config.ports.discPort).toEqual(originalPort);
    });

    it("edits the listen port", async () => {
      const originalPort = config.ports.listenPort;
      const newPort = 9000;
      mockNumberSelector.show.mockResolvedValue(newPort);

      await configMenu.editListenPort();

      expect(mockNumberSelector.show).toHaveBeenCalledWith(
        originalPort,
        "P2P listen port",
        false,
      );
      expect(configMenu.config.ports.listenPort).toEqual(newPort);
    });

    it("shows an error if listen port is out of range", async () => {
      const originalPort = config.ports.listenPort;
      mockNumberSelector.show.mockResolvedValue(1000);
      await configMenu.editListenPort();

      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
        "Port should be between 1024 and 65535.",
      );
      expect(configMenu.config.ports.listenPort).toEqual(originalPort);
    });

    it("edits the API port", async () => {
      const originalPort = config.ports.apiPort;
      const newPort = 9000;
      mockNumberSelector.show.mockResolvedValue(newPort);

      await configMenu.editApiPort();

      expect(mockNumberSelector.show).toHaveBeenCalledWith(
        originalPort,
        "API port",
        false,
      );
      expect(configMenu.config.ports.apiPort).toEqual(newPort);
    });

    it("shows an error if API port is out of range", async () => {
      const originalPort = config.ports.apiPort;
      mockNumberSelector.show.mockResolvedValue(1000);
      await configMenu.editApiPort();

      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
        "Port should be between 1024 and 65535.",
      );
      expect(configMenu.config.ports.apiPort).toEqual(originalPort);
    });
  });

  describe("save and discard changes", () => {
    it("saves changes and exits", async () => {
      await configMenu.show();
      await configMenu.saveChangesAndExit();

      expect(mockConfigService.saveConfig).toHaveBeenCalled();
      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        "Configuration changes saved.",
      );
      expect(mockMenuLoop.stopLoop).toHaveBeenCalled();
    });

    it("calls the dataDirMover when the new datadir is not equal to the original dataDir when saving changes", async () => {
      config.dataDir = "/original-data";
      await configMenu.show();

      configMenu.config.dataDir = "/new-data";
      await configMenu.saveChangesAndExit();

      expect(mockDataDirMover.moveDataDir).toHaveBeenCalledWith(
        configMenu.originalDataDir,
        configMenu.config.dataDir,
      );
    });

    it("discards changes and exits", async () => {
      await configMenu.discardChangesAndExit();

      expect(mockConfigService.loadConfig).toHaveBeenCalled();
      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        "Changes discarded.",
      );
      expect(mockMenuLoop.stopLoop).toHaveBeenCalled();
    });
  });
});
