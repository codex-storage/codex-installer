export class MainMenu {
  constructor(uiService, installMenu) {
    this.ui = uiService;
    this.installMenu = installMenu;
    this.running = true;
  }

  show = async () => {
    this.ui.showLogo();
    this.ui.showInfoMessage("hello");

    while (this.running) {
      await this.promptMainMenu();
    }

    this.ui.showInfoMessage("K-THX-BYE");
  };

  promptMainMenu = async () => {
    await this.ui.askMultipleChoice("Select an option", [
      {
        label: "Install Codex",
        action: this.installMenu.show,
      },
      {
        label: "Exit",
        action: this.closeMainMenu,
      },
    ]);
  };

  closeMainMenu = async () => {
    this.running = false;
  };
}
