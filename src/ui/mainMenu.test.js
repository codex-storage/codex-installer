import { describe, beforeEach, it, expect, vi } from "vitest";
import { MainMenu } from "./mainMenu.js";
import { mockUiService, mockCodexApp } from "../__mocks__/service.mocks.js";
import { mockInstallMenu, mockConfigMenu } from "../__mocks__/ui.mocks.js";
import {
  mockInstaller,
  mockProcessControl,
} from "../__mocks__/handler.mocks.js";
import { mockMenuLoop } from "../__mocks__/utils.mocks.js";

describe("mainmenu", () => {
  let mainmenu;

  beforeEach(() => {
    vi.resetAllMocks();

    mainmenu = new MainMenu(
      mockUiService,
      mockMenuLoop,
      mockInstallMenu,
      mockConfigMenu,
      mockInstaller,
      mockProcessControl,
      mockCodexApp,
    );
  });

  describe("constructor", () => {
    it("initializes the menu loop with the promptMainMenu function", () => {
      expect(mockMenuLoop.initialize).toHaveBeenCalledWith(
        mainmenu.promptMainMenu,
      );
    });
  });

  describe("show", () => {
    it("shows the logo", async () => {
      await mainmenu.show();

      expect(mockUiService.showLogo).toHaveBeenCalled();
    });

    it("starts the menu loop", async () => {
      await mainmenu.show();

      expect(mockMenuLoop.showLoop).toHaveBeenCalled();
    });

    it("shows the exit message after the menu loop", async () => {
      await mainmenu.show();

      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith("K-THX-BYE");
    });
  });

  describe("promptMainMenu", () => {
    beforeEach(() => {
      mainmenu.showRunningMenu = vi.fn();
      mainmenu.showNotRunningMenu = vi.fn();
      mainmenu.showNotInstalledMenu = vi.fn();
    });

    it("shows running menu when number of codex processes is greater than zero", async () => {
      mockProcessControl.getNumberOfCodexProcesses.mockResolvedValue(1);

      await mainmenu.promptMainMenu();

      expect(mainmenu.showRunningMenu).toHaveBeenCalled();
      expect(mainmenu.showNotRunningMenu).not.toHaveBeenCalled();
      expect(mainmenu.showNotInstalledMenu).not.toHaveBeenCalled();
    });

    it("shows not running menu when number of codex processes is zero and codex is installed", async () => {
      mockProcessControl.getNumberOfCodexProcesses.mockResolvedValue(0);
      mockInstaller.isCodexInstalled.mockResolvedValue(true);

      await mainmenu.promptMainMenu();

      expect(mainmenu.showRunningMenu).not.toHaveBeenCalled();
      expect(mainmenu.showNotRunningMenu).toHaveBeenCalled();
      expect(mainmenu.showNotInstalledMenu).not.toHaveBeenCalled();
    });

    it("shows not installed menu when number of codex processes is zero and codex is not installed", async () => {
      mockProcessControl.getNumberOfCodexProcesses.mockResolvedValue(0);
      mockInstaller.isCodexInstalled.mockResolvedValue(false);

      await mainmenu.promptMainMenu();

      expect(mainmenu.showRunningMenu).not.toHaveBeenCalled();
      expect(mainmenu.showNotRunningMenu).not.toHaveBeenCalled();
      expect(mainmenu.showNotInstalledMenu).toHaveBeenCalled();
    });
  });

  describe("showNotInstalledMenu", () => {
    it("shows a menu with options to install Codex or exit", async () => {
      await mainmenu.showNotInstalledMenu();

      expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
        "Codex is not installed",
        [
          { label: "Install Codex", action: mockInstallMenu.show },
          { label: "Exit", action: mockMenuLoop.stopLoop },
        ],
      );
    });
  });

  describe("showRunningMenu", () => {
    it("shows a menu with options to stop Codex, open Codex app, or exit", async () => {
      await mainmenu.showRunningMenu();

      expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
        "Codex is running",
        [
          { label: "Open Codex app", action: mockCodexApp.openCodexApp },
          { label: "Stop Codex", action: mockProcessControl.stopCodexProcess },
          { label: "Exit", action: mockMenuLoop.stopLoop },
        ],
      );
    });
  });

  describe("showNotRunningMenu", () => {
    it("shows a menu with options to start Codex, configure, uninstall, or exit", async () => {
      await mainmenu.showNotRunningMenu();

      expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
        "Codex is not running",
        [
          {
            label: "Start Codex",
            action: mockProcessControl.startCodexProcess,
          },
          { label: "Edit Codex config", action: mockConfigMenu.show },
          { label: "Uninstall Codex", action: mockInstallMenu.show },
          { label: "Exit", action: mockMenuLoop.stopLoop },
        ],
      );
    });
  });
});
