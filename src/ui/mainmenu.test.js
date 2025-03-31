import { describe, beforeEach, it, expect, vi } from "vitest";
import { MainMenu } from "./mainmenu.js";

describe("mainmenu", () => {
  let mainmenu;
  const mockUiService = {
    showLogo: vi.fn(),
    showInfoMessage: vi.fn(),
    askMultipleChoice: vi.fn(),
  };
  const mockInstallMenu = {
    show: vi.fn(),
  };

  const mockConfigMenu = {
    show: vi.fn(),
  }

  beforeEach(() => {
    vi.resetAllMocks();

    mainmenu = new MainMenu(mockUiService, mockInstallMenu, mockConfigMenu);

    // Presents test getting stuck in main loop.
    const originalPrompt = mainmenu.promptMainMenu;
    mainmenu.promptMainMenu = async () => {
      mainmenu.running = false;
      await originalPrompt();
    };
  });

  it("shows the main menu", async () => {
    await mainmenu.show();

    expect(mockUiService.showLogo).toHaveBeenCalled();
    expect(mockUiService.showInfoMessage).toHaveBeenCalledWith("hello"); // example, delete this later.
    expect(mockUiService.showInfoMessage).toHaveBeenCalledWith("K-THX-BYE"); // example, delete this later.

    expect(mockUiService.askMultipleChoice).toHaveBeenCalledWith(
      "Select an option",
      [
        { label: "Install Codex", action: mockInstallMenu.show },
        { label: "Configure Codex", action: mockConfigMenu.show },
        { label: "Exit", action: mainmenu.closeMainMenu },
      ],
    );
  });

  it("sets running to false when closeMainMenu is called", async () => {
    mainmenu.running = true;

    await mainmenu.closeMainMenu();

    expect(mainmenu.running).toEqual(false);
  });
});
