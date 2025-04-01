import { describe, beforeEach, it, expect, vi } from "vitest";
import { MainMenu } from "./mainmenu.js";
import { mockUiService } from "../__mocks__/service.mocks.js";
import { mockInstallMenu, mockConfigMenu } from "../__mocks__/ui.mocks.js";
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
    );
  });

  it("initializes the menu loop with the promptMainMenu function", () => {
    expect(mockMenuLoop.initialize).toHaveBeenCalledWith(
      mainmenu.promptMainMenu,
    );
  });

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

  it("prompts the main menu with multiple choices", async () => {
    await mainmenu.promptMainMenu();
    expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
      "Select an option",
      [
        { label: "Install Codex", action: mockInstallMenu.show },
        { label: "Configure Codex", action: mockConfigMenu.show },
        { label: "Exit", action: mockMenuLoop.stopLoop },
      ],
    );
  });
});
