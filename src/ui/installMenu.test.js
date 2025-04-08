import { describe, beforeEach, it, expect, vi } from "vitest";
import { InstallMenu } from "./installMenu.js";
import { mockUiService } from "../__mocks__/service.mocks.js";
import { mockConfigService } from "../__mocks__/service.mocks.js";
import { mockPathSelector } from "../__mocks__/utils.mocks.js";

describe("InstallMenu", () => {
  const config = {
    codexInstallPath: "/codex",
  };
  let installMenu;

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfigService.get.mockReturnValue(config);

    installMenu = new InstallMenu(
      mockUiService,
      mockConfigService,
      mockPathSelector,
    );
  });

  it("displays the install menu", async () => {
    await installMenu.show();
    expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
      "Configure your Codex installation",
      [
        {
          label: "Install path: " + config.codexInstallPath,
          action: installMenu.selectInstallPath,
        },
        {
          label: "Storage provider module: Disabled (todo)",
          action: installMenu.storageProviderOption,
        },
        {
          label: "Install!",
          action: installMenu.performInstall,
        },
        {
          label: "Cancel",
          action: installMenu.doNothing,
        },
      ],
    );
  });

  it("allows selecting the install path", async () => {
    const originalPath = config.codexInstallPath;
    const newPath = "/new/path";
    mockPathSelector.show.mockResolvedValue(newPath);

    await installMenu.selectInstallPath();

    expect(mockPathSelector.show).toHaveBeenCalledWith(originalPath, false);
    expect(config.codexInstallPath).toBe(newPath);
    expect(mockConfigService.saveConfig).toHaveBeenCalled();
  });

  it("shows storage provider option is unavailable", async () => {
    const showMock = vi.fn();
    installMenu.show = showMock;

    await installMenu.storageProviderOption();

    expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
      "This option is not currently available.",
    );
  });
});
