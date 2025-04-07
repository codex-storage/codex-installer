export class DataDirMover {
  constructor(fsService, uiService) {
    this.fs = fsService;
    this.ui = uiService;
  }

  moveDataDir = (oldPath, newPath) => {
    if (oldPath === newPath) return;

    // The Codex dataDir is a little strange:
    // If the old one is empty: The new one should not exist, so that codex creates it with the correct security permissions.
    // If the old one does exist: We move it.

    if (this.fs.isDir(oldPath)) {
      this.moveDir(oldPath, newPath);
    } else {
      this.ensureDoesNotExist(newPath);
    }
  };

  moveDir = (oldPath, newPath) => {
    this.ui.showInfoMessage(
      "Moving Codex data folder...\n" +
        `From: "${oldPath}"\n` +
        `To: "${newPath}"`,
    );

    try {
      this.fs.moveDir(oldPath, newPath);
    } catch (error) {
      console.log(
        this.ui.showErrorMessage(
          "Error while moving dataDir: " + error.message,
        ),
      );
      throw error;
    }
  };

  ensureDoesNotExist = (path) => {
    if (this.fs.isDir(path)) {
      console.log(
        this.ui.showInfoMessage(
          "Warning: the selected data path already exists.\n" +
            `New data path = "${path}"\n` +
            "Codex may overwrite data in this folder.\n" +
            "Codex will fail to start if this folder does not have the required\n" +
            "security permissions.",
        ),
      );
    }
  };
}
