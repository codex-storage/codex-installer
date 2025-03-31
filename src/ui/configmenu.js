export class ConfigMenu {
  constructor(uiService, configService, pathSelector, numberSelector) {
    this.ui = uiService;
    this.configService = configService;
    this.pathSelector = pathSelector;
    this.numberSelector = numberSelector;
  }

  show = async() => {
    this.running = true;
    this.config = this.configService.get();
    while (this.running) {
      this.ui.showInfoMessage("Codex Configuration");
      await this.ui.askMultipleChoice("Select to edit:",[
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
        }
        ]
      )
    }
  }
  
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
  }

  editDataDir = async () => {
    // todo
    // function updateDataDir(config, newDataDir) {
    //   if (config.dataDir == newDataDir) return config;
    
    //   // The Codex dataDir is a little strange:
    //   // If the old one is empty: The new one should not exist, so that codex creates it
    //   // with the correct security permissions.
    //   // If the old one does exist: We move it.
    
    //   if (isDir(config.dataDir)) {
    //     console.log(
    //       showInfoMessage(
    //         "Moving Codex data folder...\n" +
    //           `From: "${config.dataDir}"\n` +
    //           `To: "${newDataDir}"`,
    //       ),
    //     );
    
    //     try {
    //       fs.moveSync(config.dataDir, newDataDir);
    //     } catch (error) {
    //       console.log(
    //         showErrorMessage("Error while moving dataDir: " + error.message),
    //       );
    //       throw error;
    //     }
    //   } else {
    //     // Old data dir does not exist.
    //     if (isDir(newDataDir)) {
    //       console.log(
    //         showInfoMessage(
    //           "Warning: the selected data path already exists.\n" +
    //             `New data path = "${newDataDir}"\n` +
    //             "Codex may overwrite data in this folder.\n" +
    //             "Codex will fail to start if this folder does not have the required\n" +
    //             "security permissions.",
    //         ),
    //       );
    //     }
    //   }
    
    //   config.dataDir = newDataDir;
    //   return config;
    // }
  }

  editLogsDir = async () => {
    this.config.logsDir = await this.pathSelector.show(this.config.logsDir, true);
  }

  editStorageQuota = async () => {
    this.ui.showInfoMessage("You can use: 'GB' or 'gb', etc.");
    const newQuota = await this.numberSelector.show(this.config.storageQuota, "Storage quota", true);
    if (newQuota < 100 * 1024 * 1024) {
      this.ui.showErrorMessage("Storage quote should be >= 100mb.");
    } else {
      this.config.storageQuota = newQuota;
    }
  }

  editDiscPort = async () => {
    const newPort = await this.numberSelector.show(this.config.ports.discPort, "Discovery port", false);
    if (this.isInPortRange(newPort)) {
      this.config.ports.discPort = newPort;
    }
  }

  editListenPort = async () => {
    const newPort = await this.numberSelector.show(this.config.ports.listenPort, "P2P listen port", false);
    if (this.isInPortRange(newPort)) {
      this.config.ports.listenPort = newPort;
    }
  }

  editApiPort = async () => {
    const newPort = await this.numberSelector.show(this.config.ports.apiPort, "API port", false);
    if (this.isInPortRange(newPort)) {
      this.config.ports.apiPort = newPort;
    }
  }

  isInPortRange = (number) => {
    if (number < 1024 || number > 65535) {
      this.ui.showErrorMessage("Port should be between 1024 and 65535.");
      return false;
    } 
    return true;
  }

  saveChangesAndExit = async () => {
    this.configService.saveConfig();
    this.ui.showInfoMessage("Configuration changes saved.");
    this.running = false;
  }

  discardChangesAndExit = async () => {
    this.configService.loadConfig();
    this.ui.showInfoMessage("Changes discarded.");
    this.running = false;
  }
}
