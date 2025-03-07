export class InstallMenu {
  constructor(uiService, config) {
    this.ui = uiService;
    this.config = config;
  }

  show = async () => {
    await this.ui.askMultipleChoice("Configure your Codex installation", [
      {
        label: "Install path: " + this.config.codexPath,
        action: async function () {
          console.log("run path selector");
        },
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
        action: async function () {},
      },
    ]);
  };

  storageProviderOption = async () => {
    this.ui.showInfoMessage("This option is not currently available.");
    await this.show();
  };

  performInstall = async () => {
    console.log("todo");
  };
}
