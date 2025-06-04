import { describe, beforeEach, it, expect, vi } from "vitest";
import { MainMenu } from "./mainMenu.js";
import { mockUiService, mockCodexApp } from "../__mocks__/service.mocks.js";
import {
  mockInstallMenu,
  mockConfigMenu,
  mockDataMenu,
} from "../__mocks__/ui.mocks.js";
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
      mockDataMenu,
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
  });

  describe("process control", () => {
    const mockSpinner = {
      isMock: "yes",
    };

    beforeEach(() => {
      mockUiService.createAndStartSpinner.mockReturnValue(mockSpinner);
    });

    describe("startCodex", () => {
      it("starts codex", async () => {
        await mainmenu.startCodex();

        expect(mockProcessControl.startCodexProcess).toHaveBeenCalled();
      });

      it("shows error message when process control throws", async () => {
        mockProcessControl.startCodexProcess.mockRejectedValueOnce(
          new Error("A!"),
        );

        await mainmenu.startCodex();

        expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
          'Failed to start Codex. "Error: A!"',
        );
      });

      it("starts spinner", async () => {
        await mainmenu.startCodex();

        expect(mockUiService.createAndStartSpinner).toHaveBeenCalledWith(
          "Starting...",
        );
      });

      it("stops spinner on success", async () => {
        await mainmenu.startCodex();

        expect(mockUiService.stopSpinnerSuccess).toHaveBeenCalledWith(
          mockSpinner,
        );
      });

      it("stops spinner on failure", async () => {
        mockProcessControl.startCodexProcess.mockRejectedValueOnce(
          new Error("A!"),
        );

        await mainmenu.startCodex();

        expect(mockUiService.stopSpinnerError).toHaveBeenCalledWith(
          mockSpinner,
        );
      });
    });

    describe("stopCodex", () => {
      it("stops codex", async () => {
        await mainmenu.stopCodex();

        expect(mockProcessControl.stopCodexProcess).toHaveBeenCalled();
      });

      it("shows error message when process control throws", async () => {
        mockProcessControl.stopCodexProcess.mockRejectedValueOnce(
          new Error("A!"),
        );

        await mainmenu.stopCodex();

        expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
          'Failed to stop Codex. "Error: A!"',
        );
      });

      it("starts spinner", async () => {
        await mainmenu.stopCodex();

        expect(mockUiService.createAndStartSpinner).toHaveBeenCalledWith(
          "Stopping...",
        );
      });

      it("stops spinner on success", async () => {
        await mainmenu.stopCodex();

        expect(mockUiService.stopSpinnerSuccess).toHaveBeenCalledWith(
          mockSpinner,
        );
      });

      it("stops spinner on failure", async () => {
        mockProcessControl.stopCodexProcess.mockRejectedValueOnce(
          new Error("A!"),
        );

        await mainmenu.stopCodex();

        expect(mockUiService.stopSpinnerError).toHaveBeenCalledWith(
          mockSpinner,
        );
      });
    });
  });
});
