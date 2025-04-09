export class MainMenu {
  constructor(uiService, menuLoop, installMenu, configMenu) {
    this.ui = uiService;
    this.loop = menuLoop;
    this.installMenu = installMenu;
    this.configMenu = configMenu;

    this.loop.initialize(this.promptMainMenu);
  }

  show = async () => {
    this.ui.showLogo();

    await this.loop.showLoop();

    this.ui.showInfoMessage("K-THX-BYE");
  };

  promptMainMenu = async () => {
    await this.ui.askMultipleChoice("Select an option", [
      {
        label: "Install/uninstall Codex",
        action: this.installMenu.show,
      },
      {
        label: "Configure Codex",
        action: this.configMenu.show,
      },
      {
        label: "Exit",
        action: this.loop.stopLoop,
      },
    ]);
  };
}
