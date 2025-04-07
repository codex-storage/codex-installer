export class ConfigMenu {
  constructor(
    uiService,
    menuLoop,
    configService,
    pathSelector,
    numberSelector,
    dataDirMover,
  ) {
    this.ui = uiService;
    this.loop = menuLoop;
    this.configService = configService;
    this.pathSelector = pathSelector;
    this.numberSelector = numberSelector;
    this.dataDirMover = dataDirMover;

    this.loop.initialize(this.showConfigMenu);
  }

  show = async () => {
    this.config = this.configService.get();
    this.originalDataDir = this.config.dataDir;
    this.ui.showInfoMessage("Codex Configuration");
    await this.loop.showLoop();
  };

  showConfigMenu = async () => {
    await this.ui.askMultipleChoice("Select to edit:", [
      {
        label: `Data path = "${this.config.dataDir}"`,
        action: this.editDataDir,
      },
      {
        label: `Logs path = "${this.config.logsDir}"`,
        action: this.editLogsDir,
      },
      {
        label: `Storage quota = ${this.bytesAmountToString(this.config.storageQuota)}`,
        action: this.editStorageQuota,
      },
      {
        label: `Discovery port = ${this.config.ports.discPort}`,
        action: this.editDiscPort,
      },
      {
        label: `P2P listen port = ${this.config.ports.listenPort}`,
        action: this.editListenPort,
      },
      {
        label: `API port = ${this.config.ports.apiPort}`,
        action: this.editApiPort,
      },
      {
        label: "Save changes and exit",
        action: this.saveChangesAndExit,
      },
      {
        label: "Discard changes and exit",
        action: this.discardChangesAndExit,
      },
    ]);
  };

  // this and the byte-format handling in
  // numberSelector should be extracted to
  // their own util.
  bytesAmountToString = (numBytes) => {
    const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    var value = numBytes;
    var index = 0;
    while (value > 1024) {
      index = index + 1;
      value = value / 1024;
    }

    if (index == 0) return `${numBytes} Bytes`;
    return `${numBytes} Bytes (${value} ${units[index]})`;
  };

  editDataDir = async () => {
    this.config.dataDir = await this.pathSelector.show(
      this.config.dataDir,
      false,
    );
  };

  editLogsDir = async () => {
    this.config.logsDir = await this.pathSelector.show(
      this.config.logsDir,
      true,
    );
  };

  editStorageQuota = async () => {
    this.ui.showInfoMessage("You can use: 'GB' or 'gb', etc.");
    const newQuota = await this.numberSelector.show(
      this.config.storageQuota,
      "Storage quota",
      true,
    );
    if (newQuota < 100 * 1024 * 1024) {
      this.ui.showErrorMessage("Storage quote should be >= 100mb.");
    } else {
      this.config.storageQuota = newQuota;
    }
  };

  editDiscPort = async () => {
    const newPort = await this.numberSelector.show(
      this.config.ports.discPort,
      "Discovery port",
      false,
    );
    if (this.isInPortRange(newPort)) {
      this.config.ports.discPort = newPort;
    }
  };

  editListenPort = async () => {
    const newPort = await this.numberSelector.show(
      this.config.ports.listenPort,
      "P2P listen port",
      false,
    );
    if (this.isInPortRange(newPort)) {
      this.config.ports.listenPort = newPort;
    }
  };

  editApiPort = async () => {
    const newPort = await this.numberSelector.show(
      this.config.ports.apiPort,
      "API port",
      false,
    );
    if (this.isInPortRange(newPort)) {
      this.config.ports.apiPort = newPort;
    }
  };

  isInPortRange = (number) => {
    if (number < 1024 || number > 65535) {
      this.ui.showErrorMessage("Port should be between 1024 and 65535.");
      return false;
    }
    return true;
  };

  saveChangesAndExit = async () => {
    if (this.config.dataDir !== this.originalDataDir) {
      // The Codex data-dir is a little special.
      // Use a dedicated module to move it.
      await this.dataDirMover.moveDataDir(
        this.originalDataDir,
        this.config.dataDir,
      );
    }

    this.configService.saveConfig();
    this.ui.showInfoMessage("Configuration changes saved.");
    this.loop.stopLoop();
  };

  discardChangesAndExit = async () => {
    this.configService.loadConfig();
    this.ui.showInfoMessage("Changes discarded.");
    this.loop.stopLoop();
  };
}
