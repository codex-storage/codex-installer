import { describe, beforeEach, it, expect, vi } from "vitest";
import { InstallMenu } from "./installMenu.js";
import { mockUiService } from "../__mocks__/service.mocks.js";
import { mockConfigService } from "../__mocks__/service.mocks.js";
import { mockPathSelector } from "../__mocks__/utils.mocks.js";
import { mockInstaller } from "../__mocks__/handler.mocks.js";

describe("InstallMenu", () => {
  const config = {
    codexRoot: "/codex",
  };
  let installMenu;

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfigService.get.mockReturnValue(config);

    installMenu = new InstallMenu(
      mockUiService,
      mockConfigService,
      mockPathSelector,
      mockInstaller,
    );
  });

  describe("show", () => {
    beforeEach(() => {
      installMenu.showInstallMenu = vi.fn();
      installMenu.showUninstallMenu = vi.fn();
    });

    it("shows uninstall menu when codex is installed", async () => {
      mockInstaller.isCodexInstalled.mockResolvedValue(true);

      await installMenu.show();

      expect(installMenu.showUninstallMenu).toHaveBeenCalled();
    });

    it("shows install menu when codex is not installed", async () => {
      mockInstaller.uninstallCodex.mockResolvedValue(false);

      await installMenu.show();

      expect(installMenu.showInstallMenu).toHaveBeenCalled();
    });
  });

  it("displays the install menu", async () => {
    await installMenu.showInstallMenu();
    expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
      "Configure your Codex installation",
      [
        {
          label: "Install path: " + config.codexRoot,
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

  it("displays the uninstall menu", async () => {
    await installMenu.showUninstallMenu();
    expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
      "Codex is installed",
      [
        {
          label: "Uninstall",
          action: installMenu.showConfirmUninstall,
        },
        {
          label: "Cancel",
          action: installMenu.doNothing,
        },
      ],
    );
  });

  it("confirms uninstall", async () => {
    await installMenu.showConfirmUninstall();

    expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
      "You are about to:\n" +
        " - Uninstall the Codex application\n" +
        " - Delete the data stored in your Codex node\n" +
        " - Delete the log files of your Codex node",
    );

    expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
      "Are you sure you want to uninstall Codex?",
      [
        {
          label: "No",
          action: installMenu.doNothing,
        },
        {
          label: "Yes",
          action: installMenu.performUninstall,
        },
      ],
    );
  });

  it("allows selecting the install path", async () => {
    const originalPath = config.codexRoot;
    const newPath = "/new/path";
    mockPathSelector.show.mockResolvedValue(newPath);

    await installMenu.selectInstallPath();

    expect(mockPathSelector.show).toHaveBeenCalledWith(originalPath, false);
    expect(config.codexRoot).toBe(newPath);
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

  it("calls installed for installation", async () => {
    await installMenu.performInstall();

    expect(mockInstaller.installCodex).toHaveBeenCalledWith(installMenu);
  });

  it("calls installer for deinstallation", async () => {
    await installMenu.performUninstall();

    expect(mockInstaller.uninstallCodex).toHaveBeenCalled();
  });

  describe("process callback handling", () => {
    const mockSpinner = {
      isRealSpinner: "no srry",
    };

    beforeEach(() => {
      mockUiService.createAndStartSpinner.mockReturnValue(mockSpinner);
    });

    it("creates spinner on installStarts", () => {
      installMenu.installStarts();

      expect(installMenu.installSpinner).toBe(mockSpinner);
      expect(mockUiService.createAndStartSpinner).toHaveBeenCalledWith(
        "Installing...",
      );
    });

    it("shows download success message", () => {
      installMenu.downloadSuccessful();

      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        "Download successful...",
      );
    });

    it("shows install success message", () => {
      installMenu.installSpinner = mockSpinner;

      installMenu.installSuccessful();

      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        "Installation successful!",
      );
      expect(mockUiService.stopSpinnerSuccess).toHaveBeenCalledWith(
        mockSpinner,
      );
    });

    it("shows warnings", () => {
      const message = "warning!";
      installMenu.installSpinner = mockSpinner;

      installMenu.warn(message);

      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(message);
      expect(mockUiService.stopSpinnerError).toHaveBeenCalledWith(mockSpinner);
    });
  });
});
