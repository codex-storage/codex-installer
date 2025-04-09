export class InstallMenu {
  constructor(uiService, configService, pathSelector, installer) {
    this.ui = uiService;
    this.configService = configService;
    this.config = configService.get();
    this.pathSelector = pathSelector;
    this.installer = installer;
  }

  show = async () => {
    if (await this.installer.isCodexInstalled()) {
      await this.showUninstallMenu();
    } else {
      await this.showInstallMenu();
    }
  }

  showUninstallMenu = async () => {
    await this.ui.askMultipleChoice("Codex is installed", [
      {
        label: "Uninstall",
        action: this.performUninstall,
      },
      {
        label: "Cancel",
        action: this.doNothing,
      },
    ]);
  }

  showInstallMenu = async () => {
    await this.ui.askMultipleChoice("Configure your Codex installation", [
      {
        label: "Install path: " + this.config.codexInstallPath,
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

  selectInstallPath = async () => {
    this.config.codexInstallPath = await this.pathSelector.show(
      this.config.codexInstallPath,
      false,
    );
    this.configService.saveConfig();
  };

  storageProviderOption = async () => {
    this.ui.showInfoMessage("This option is not currently available.");
    await this.show();
  };

  performInstall = async () => {
    await this.installer.installCodex(this);
  };

  performUninstall = async () => {};

  doNothing = async () => {};

  // Progress callbacks from installer module:
  installStarts = () => {
    this.installSpinner = this.ui.createAndStartSpinner("Installing...");
  };

  downloadSuccessful = () => {
    this.ui.showInfoMessage("Download successful...");
  }

  installSuccessful = () => {
    this.ui.showInfoMessage("Installation successful!");
    this.ui.stopSpinnerSuccess(this.installSpinner);
  }

  warn = (message) => {
    this.ui.showErrorMessage(message);
    this.ui.stopSpinnerError(this.installSpinner);
  };
}
