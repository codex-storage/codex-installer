import { describe, beforeEach, it, expect, vi } from "vitest";
import { ConfigMenu } from "./configmenu.js";
import { mockUiService } from "../__mocks__/service.mocks.js";
import { mockConfigService } from "../__mocks__/service.mocks.js";
import { mockPathSelector, mockNumberSelector } from "../__mocks__/ui.mocks.js";

describe("ConfigMenu", () => {
  let configMenu;

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfigService.get.mockReturnValue({
      dataDir: "/data", 
      logsDir: "/logs",
      storageQuota: 1024 * 1024 * 1024,
      ports: {
        discPort: 8090,
        listenPort: 8070,
        apiPort: 8080,
      }
    });

    configMenu = new ConfigMenu(
      mockUiService,
      mockConfigService,
      mockPathSelector,
      mockNumberSelector
    );
  });

  // it("displays the configuration menu", async () => {
  //   configMenu.running = false; // Prevent infinite loop
  //   await configMenu.show();

  //   expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
  //     "Codex Configuration",
  //   );
  //   expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith([
  //       {
  //         label: `Data path = "${mockConfigService.get().dataDir}"`,
  //         action: configMenu.editDataDir,
  //       },
  //       {
  //         label: `Logs path = "${mockConfigService.get().logsDir}"`,
  //         action: configMenu.editLogsDir,
  //       },
  //       {
  //         label: `Storage quota = 1Gb`,
  //         action: configMenu.editStorageQuota,
  //       },
  //       {
  //         label: `Discovery port = ${mockConfigService.get().ports.discPort}`,
  //         action: configMenu.editDiscPort,
  //       },
  //       {
  //         label: `P2P listen port = ${mockConfigService.get().ports.listenPort}`,
  //         action: configMenu.editListenPort,
  //       },
  //       {
  //         label: `API port = ${mockConfigService.get().ports.apiPort}`,
  //         action: configMenu.editApiPort,
  //       },
  //       {
  //         label: "Save changes and exit",
  //         action: configMenu.saveChangesAndExit,
  //       },
  //       {
  //         label: "Discard changes and exit",
  //         action: configMenu.discardChangesAndExit,
  //       }
  //       ]);
  // });

//   it("edits the logs directory", async () => {
//     mockPathSelector.show.mockResolvedValue("/new-logs");
//     await configMenu.editLogsDir();

//     expect(mockPathSelector.show).toHaveBeenCalledWith("/logs", true);
//     expect(configMenu.config.logsDir).toEqual("/new-logs");
//   });

//   it("edits the storage quota", async () => {
//     mockNumberSelector.show.mockResolvedValue(200 * 1024 * 1024);
//     await configMenu.editStorageQuota();

//     expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
//       "You can use: 'GB' or 'gb', etc.",
//     );
//     expect(mockNumberSelector.show).toHaveBeenCalledWith(
//       1024 * 1024 * 1024,
//       "Storage quota",
//       true,
//     );
//     expect(configMenu.config.storageQuota).toEqual(200 * 1024 * 1024);
//   });

//   it("shows an error if storage quota is too small", async () => {
//     mockNumberSelector.show.mockResolvedValue(50 * 1024 * 1024);
//     await configMenu.editStorageQuota();

//     expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
//       "Storage quote should be >= 100mb.",
//     );
//     expect(configMenu.config.storageQuota).toEqual(1024 * 1024 * 1024); // Unchanged
//   });

//   it("edits the discovery port", async () => {
//     mockNumberSelector.show.mockResolvedValue(9000);
//     await configMenu.editDiscPort();

//     expect(mockNumberSelector.show).toHaveBeenCalledWith(8090, "Discovery port", false);
//     expect(configMenu.config.ports.discPort).toEqual(9000);
//   });

//   it("shows an error if port is out of range", async () => {
//     mockNumberSelector.show.mockResolvedValue(1000);
//     await configMenu.editDiscPort();

//     expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
//       "Port should be between 1024 and 65535.",
//     );
//     expect(configMenu.config.ports.discPort).toEqual(8090); // Unchanged
//   });

//   it("saves changes and exits", async () => {
//     await configMenu.saveChangesAndExit();

//     expect(mockConfigService.saveConfig).toHaveBeenCalled();
//     expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
//       "Configuration changes saved.",
//     );
//     expect(configMenu.running).toEqual(false);
//   });

//   it("discards changes and exits", async () => {
//     await configMenu.discardChangesAndExit();

//     expect(mockConfigService.loadConfig).toHaveBeenCalled();
//     expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
//       "Changes discarded.",
//     );
//     expect(configMenu.running).toEqual(false);
//   });
});
