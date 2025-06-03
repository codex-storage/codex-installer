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
    feedbackService,
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
    this.feedbackService = feedbackService;
    this.nodeStatusMenu = nodeStatusMenu;

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
        action: this.ifNotInstalled(this.installMenu.show),
      },
      {
        label: "Start Codex node",
        action: this.ifInstalled(this.ifNotRunning(this.startCodex)),
      },
      {
        label: "Check node status",
        action: this.ifRunning(this.nodeStatusMenu.showNodeStatus),
      },
      {
        label: "Upload a file",
        action: this.ifRunning(this.dataMenu.performUpload),
      },
      {
        label: "Download a file",
        action: this.ifRunning(this.dataMenu.performDownload),
      },
      {
        label: "Show local data",
        action: this.ifRunning(this.dataMenu.showLocalData),
      },
      {
        label: "Stop Codex node",
        action: this.ifRunning(this.stopCodex),
      },
      {
        label: "Uninstall Codex node",
        action: this.ifInstalled(this.ifNotRunning(this.installMenu.show)),
      },
      {
        label: "Submit feedback",
        action: this.feedbackService.openFeedbackPage,
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

  ifInstalled = async (call) => {
    if (await this.isInstalled()) {
      await call();
    } else {
      this.ui.showInfoMessage("Codex is not yet installed.");
    }
  }

  ifNotInstalled = async (call) => {
    if (!await this.isInstalled()) {
      await call();
    } else {
      this.ui.showInfoMessage("Codex is installed.");
    }
  }

  ifRunning = async (call) => {
    if (await this.isRunning()) {
      await call();
    } else {
      this.ui.showInfoMessage("Codex is not yet running.");
    }
  };

  ifNotRunning = async (call) => {
    if (!await this.isRunning()) {
      await call();
    } else {
      this.ui.showInfoMessage("Codex is running.");
    }    
  };

  isInstalled = async () => {
    return await this.installer.isCodexInstalled();
  };

  isRunning = async () => {
    return ((await this.processControl.getNumberOfCodexProcesses()) > 0);
  };
}
