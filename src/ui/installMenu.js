export class InstallMenu {
  constructor(uiService, menuLoop, configService, pathSelector, installer) {
    this.ui = uiService;
    this.loop = menuLoop;
    this.configService = configService;
    this.config = configService.get();
    this.pathSelector = pathSelector;
    this.installer = installer;

    this.loop.initialize(this.showMenu);
  }

  show = async () => {
    await this.loop.showLoop();
  };

  showMenu = async () => {
    if (await this.installer.isCodexInstalled()) {
      await this.showUninstallMenu();
    } else {
      await this.showInstallMenu();
    }
  };

  showInstallMenu = async () => {
    await this.ui.askMultipleChoice("Configure your Codex installation", [
      {
        label: "Install path: " + this.config.codexRoot,
        action: this.selectInstallPath,
      },
      {
        label: "Storage provider module: Disabled (todo)",
        action: this.storageProviderOption,
      },
      {
        label: "Install!",
        action: this.performInstall,
      },
      {
        label: "Cancel",
        action: this.doNothing,
      },
    ]);
  };

  showUninstallMenu = async () => {
    await this.ui.askMultipleChoice("Codex is installed", [
      {
        label: "Uninstall",
        action: this.showConfirmUninstall,
      },
      {
        label: "Cancel",
        action: this.doNothing,
      },
    ]);
  };

  showConfirmUninstall = async () => {
    this.ui.showInfoMessage(
      "You are about to:\n" +
        " - Uninstall the Codex application\n" +
        " - Delete your Codex ethereum keys\n" +
        " - Delete the data stored in your Codex node\n" +
        " - Delete the log files of your Codex node",
    );

    await this.ui.askMultipleChoice(
      "Are you sure you want to uninstall Codex?",
      [
        {
          label: "No",
          action: this.doNothing,
        },
        {
          label: "Yes",
          action: this.performUninstall,
        },
      ],
    );
  };

  selectInstallPath = async () => {
    this.config.codexRoot = await this.pathSelector.show(
      this.config.codexRoot,
      false,
    );
    this.configService.saveConfig();
  };

  storageProviderOption = async () => {
    this.ui.showInfoMessage("This option is not currently available.");
    await this.show();
  };

  performInstall = async () => {
    this.loop.stopLoop();
    await this.installer.installCodex(this);
  };

  performUninstall = async () => {
    this.loop.stopLoop();
    this.installer.uninstallCodex();
  };

  doNothing = async () => {
    this.loop.stopLoop();
  };

  // Progress callbacks from installer module:
  installStarts = () => {
    this.installSpinner = this.ui.createAndStartSpinner("Installing...");
  };

  downloadSuccessful = () => {
    this.ui.showInfoMessage("Download successful...");
  };

  installSuccessful = () => {
    this.ui.showInfoMessage("Installation successful!");
    this.ui.stopSpinnerSuccess(this.installSpinner);
  };

  warn = (message) => {
    this.ui.showErrorMessage(message);
    this.ui.stopSpinnerError(this.installSpinner);
  };
}
