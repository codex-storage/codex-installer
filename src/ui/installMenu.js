export class InstallMenu {
  constructor(uiService, configService, pathSelector) {
    this.ui = uiService;
    this.configService = configService;
    this.config = configService.get();
    this.pathSelector = pathSelector;
  }

  show = async () => {
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

  performInstall = async () => {};

  doNothing = async () => {};
}
