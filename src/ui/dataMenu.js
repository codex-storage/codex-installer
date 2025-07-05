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
    try {
      const localData = await this.dataService.localData();
      this.displayLocalData(localData);
    } catch (exception) {
      this.ui.showErrorMessage("Failed to fetch local data: " + exception);
    }
  };

  displayLocalData = (filesData) => {
    if (filesData.content && filesData.content.length > 0) {
      this.ui.showInfoMessage(
        `Found ${filesData.content.length} local file(s)`,
      );

      filesData.content.forEach((file, index) => {
        const { cid, manifest } = file;
        const {
          datasetSize,
          protected: isProtected,
          filename,
          mimetype,
        } = manifest;

        const fileSize = (datasetSize / 1024).toFixed(2);

        this.ui.showInfoMessage(
          `File ${index + 1} of ${filesData.content.length}\n\n` +
            `Filename: ${filename}\n` +
            `CID: ${cid}\n` +
            `Size: ${fileSize} KB\n` +
            `MIME Type: ${mimetype}\n` +
            `Protected: ${isProtected ? "Yes" : "No"}`,
        );
      });
    } else {
      this.ui.showInfoMessage("Node contains no datasets.");
    }
  };
}
