export class MainMenu {
  constructor(
    uiService,
    menuLoop,
    installMenu,
    configMenu,
    installer,
    processControl,
    codexApp,
    dataMenu,
  ) {
    this.ui = uiService;
    this.loop = menuLoop;
    this.installMenu = installMenu;
    this.configMenu = configMenu;
    this.installer = installer;
    this.processControl = processControl;
    this.codexApp = codexApp;
    this.dataMenu = dataMenu;

    this.loop.initialize(this.promptMainMenu);
  }

  show = async () => {
    this.ui.showLogo();

    await this.loop.showLoop();
  };

  promptMainMenu = async () => {
    await this.ui.askMultipleChoice("Select an option", [
      {
        label: "Download and install Codex",
        action: this.installMenu.show,
      },
      {
        label: "Start Codex node",
        action: this.startCodex,
      },
      {
        label: "Check node status",
        action: this.dataMenu.showNodeStatus,
      },
      {
        label: "Upload a file",
        action: this.dataMenu.performUpload,
      },
      {
        label: "Download a file",
        action: this.dataMenu.performDownload,
      },
      {
        label: "Show local data",
        action: this.dataMenu.showLocalData,
      },
      {
        label: "Stop Codex node",
        action: this.stopCodex,
      },
      {
        label: "Uninstall Codex node",
        action: this.installMenu.show,
      },
      {
        label: "Submit feedback",
        action: ,
      },
      {
        label: "Exit",
        action: this.loop.stopLoop,
      },
    ]);
  };

  startCodex = async () => {
    const spinner = this.ui.createAndStartSpinner("Starting...");
    try {
      await this.processControl.startCodexProcess();
      this.ui.stopSpinnerSuccess(spinner);
    } catch (exception) {
      this.ui.stopSpinnerError(spinner);
      this.ui.showErrorMessage(`Failed to start Codex. "${exception}"`);
    }
  };

  stopCodex = async () => {
    const spinner = this.ui.createAndStartSpinner("Stopping...");
    try {
      await this.processControl.stopCodexProcess();
      this.ui.stopSpinnerSuccess(spinner);
    } catch (exception) {
      this.ui.stopSpinnerError(spinner);
      this.ui.showErrorMessage(`Failed to stop Codex. "${exception}"`);
    }
  };
}
