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
    nodeStatusMenu,
  ) {
    this.ui = uiService;
    this.loop = menuLoop;
    this.installMenu = installMenu;
    this.configMenu = configMenu;
    this.installer = installer;
    this.processControl = processControl;
    this.codexApp = codexApp;
    this.dataMenu = dataMenu;
    this.nodeStatusMenu = nodeStatusMenu;

    this.loop.initialize(this.promptMainMenu);
  }

  show = async () => {
    this.ui.showLogo();

    await this.loop.showLoop();
  };

  promptMainMenu = async () => {
    if ((await this.processControl.getNumberOfCodexProcesses()) > 0) {
      await this.showRunningMenu();
    } else {
      if (await this.installer.isCodexInstalled()) {
        await this.showNotRunningMenu();
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
        label: "Open Codex app",
        action: this.codexApp.openCodexApp,
      },
      {
        label: "Stop Codex",
        action: this.stopCodex,
      },
      {
        label: "Show node status",
        action: this.nodeStatusMenu.showNodeStatus,
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
        label: "Exit (Codex keeps running)",
        action: this.loop.stopLoop,
      },
    ]);
  };

  showNotRunningMenu = async () => {
    await this.ui.askMultipleChoice("Codex is installed but not running", [
      {
        label: "Start Codex",
        action: this.startCodex,
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
