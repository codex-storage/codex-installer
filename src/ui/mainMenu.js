export class MainMenu {
  constructor(
    uiService,
    menuLoop,
    installMenu,
    configMenu,
    installer,
    processControl,
  ) {
    this.ui = uiService;
    this.loop = menuLoop;
    this.installMenu = installMenu;
    this.configMenu = configMenu;
    this.installer = installer;
    this.processControl = processControl;

    this.loop.initialize(this.promptMainMenu);
  }

  show = async () => {
    this.ui.showLogo();

    await this.loop.showLoop();

    this.ui.showInfoMessage("K-THX-BYE");
  };

  promptMainMenu = async () => {
    if ((await this.processControl.getNumberOfCodexProcesses) > 0) {
      await this.showRunningMenu();
    } else {
      if (await this.installer.isCodexInstalled()) {
        await this.showCodexNotRunningMenu();
      } else {
        await this.showNotInstalledMenu();
      }
    }
  };

  showNotInstalledMenu = async () => {
    await this.ui.askMultipleChoice("Codex is not installed", [
      {
        label: "Install Codex",
        action: this.installMenu.show,
      },
      {
        label: "Exit",
        action: this.loop.stopLoop,
      },
    ]);
  };

  showRunningMenu = async () => {
    await this.ui.askMultipleChoice("Codex is running", [
      {
        label: "Stop Codex",
        action: this.processControl.stopCodexProcess,
      },
      {
        label: "Open Codex app",
        action: this.openCodexApp,
      },
      {
        label: "Exit",
        action: this.loop.stopLoop,
      },
    ]);
  };

  openCodexApp = async () => {
    console.log("todo!");
  };

  showCodexNotRunningMenu = async () => {
    await this.ui.askMultipleChoice("Codex is not running", [
      {
        label: "Start Codex",
        action: this.processControl.startCodexProcess,
      },
      {
        label: "Edit Codex config",
        action: this.configMenu.show,
      },
      {
        label: "Uninstall Codex",
        action: this.installMenu.show,
      },
      {
        label: "Exit",
        action: this.loop.stopLoop,
      },
    ]);
  };
}
