export class DataMenu {
  constructor(uiService, fsService, dataService) {
    this.ui = uiService;
    this.fs = fsService;
    this.dataService = dataService;
  }

  performUpload = async () => {
    this.ui.showInfoMessage(
      "⚠️  Codex does not encrypt files. Anything uploaded will be available publicly on testnet.",
    );

    const filePath = await this.ui.askPrompt("Enter the file path");
    if (!this.fs.isFile(filePath)) {
      this.ui.showErrorMessage("File not found");
    } else {
      try {
        const cid = await this.dataService.upload(filePath);
        this.ui.showInfoMessage(`Upload successful.\n CID: '${cid}'`);
      } catch (exception) {
        this.ui.showErrorMessage("Error during upload: " + exception);
      }
    }
  };

  performDownload = async () => {
    const cid = await this.ui.askPrompt("Enter the CID");
    if (cid.length < 1) return;
    try {
      const filename = await this.dataService.download(cid);
      this.ui.showInfoMessage(`Download successful.\n File: '${filename}'`);
    } catch (exception) {
      this.ui.showErrorMessage("Error during download: " + exception);
    }
  };

  showLocalData = async () => {

  };
}
