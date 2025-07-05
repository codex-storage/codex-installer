import { describe, beforeEach, it, expect, vi } from "vitest";
import { DataMenu } from "./dataMenu.js";
import {
  mockUiService,
  mockFsService,
  mockDataService,
} from "../__mocks__/service.mocks.js";

describe("DataMenu", () => {
  let dataMenu;
  const filePath = "testfilepath";
  const cid = "testcid";

  beforeEach(() => {
    vi.resetAllMocks();

    dataMenu = new DataMenu(mockUiService, mockFsService, mockDataService);
  });

  describe("performUpload", () => {
    beforeEach(() => {
      mockUiService.askPrompt.mockResolvedValue(filePath);
      mockDataService.upload.mockResolvedValue(cid);
    });

    it("shows encryption warning", async () => {
      await dataMenu.performUpload();

      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        "⚠️  Codex does not encrypt files. Anything uploaded will be available publicly on testnet.",
      );
    });

    it("prompts the user for a filepath", async () => {
      await dataMenu.performUpload();

      expect(mockUiService.askPrompt).toHaveBeenCalledWith(
        "Enter the file path",
      );
    });

    it("checks that the provided path is a file", async () => {
      await dataMenu.performUpload();

      expect(mockFsService.isFile).toHaveBeenCalledWith(filePath);
    });

    it("shows an error when the provided path is not a file", async () => {
      mockFsService.isFile.mockReturnValue(false);

      await dataMenu.performUpload();

      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
        "File not found",
      );
    });

    it("calls the data service if the file does exist", async () => {
      mockFsService.isFile.mockReturnValue(true);

      await dataMenu.performUpload();

      expect(mockDataService.upload).toHaveBeenCalledWith(filePath);
      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        `Upload successful.\n CID: '${cid}'`,
      );
    });

    it("shows an error message when dataService throws", async () => {
      const error = "testError";
      mockFsService.isFile.mockReturnValue(true);
      mockDataService.upload.mockRejectedValueOnce(new Error(error));

      await dataMenu.performUpload();

      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
        "Error during upload: Error: " + error,
      );
    });
  });

  describe("performDownload", () => {
    beforeEach(() => {
      mockUiService.askPrompt.mockResolvedValue(cid);
      mockDataService.download.mockResolvedValue(filePath);
    });

    it("prompts the user for a cid", async () => {
      await dataMenu.performDownload();

      expect(mockUiService.askPrompt).toHaveBeenCalledWith("Enter the CID");
    });

    it("does nothing if provided input is empty", async () => {
      mockUiService.askPrompt = vi.fn();
      mockUiService.askPrompt.mockResolvedValue("");

      await dataMenu.performDownload();

      expect(mockDataService.download).not.toHaveBeenCalled();
    });

    it("calls the data service with the provided cid", async () => {
      await dataMenu.performDownload();

      expect(mockDataService.download).toHaveBeenCalledWith(cid);
      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        `Download successful.\n File: '${filePath}'`,
      );
    });

    it("shows an error message when dataService throws", async () => {
      const error = "testError";
      mockDataService.download.mockRejectedValueOnce(new Error(error));

      await dataMenu.performDownload();

      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
        "Error during download: Error: " + error,
      );
    });
  });

  describe("showLocalData", () => {
    beforeEach(() => {
      dataMenu.displayLocalData = vi.fn();
    });

    it("calls localData on dataService", async () => {
      await dataMenu.showLocalData();

      expect(mockDataService.localData).toHaveBeenCalled();
    });

    it("passes localData to displayLocalData", async () => {
      const someData = "yes";

      mockDataService.localData.mockResolvedValue(someData);

      await dataMenu.showLocalData();

      expect(dataMenu.displayLocalData).toHaveBeenCalledWith(someData);
    });

    it("shows an error message when localData raises", async () => {
      const error = "Omg error!";
      mockDataService.localData.mockRejectedValue(new Error(error));

      await dataMenu.showLocalData();

      expect(dataMenu.displayLocalData).not.toHaveBeenCalled();
      expect(mockUiService.showErrorMessage).toHaveBeenCalledWith(
        "Failed to fetch local data: Error: " + error,
      );
    });
  });

  describe("displayLocalData", () => {
    const cid = "testCid";
    const datasetSize = 2048;
    var isProtected = true;
    const filename = "filename.test";
    const mimetype = "test";
    var fileData = {};

    beforeEach(() => {
      fileData = {
        content: [
          {
            cid: cid,
            manifest: {
              datasetSize,
              protected: isProtected,
              filename,
              mimetype,
            },
          },
        ],
      };
    });

    it("shows no datasets when content is undefined", () => {
      fileData.content = undefined;

      dataMenu.displayLocalData(fileData);

      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        "Node contains no datasets.",
      );
    });

    it("shows no datasets when content is empty array", () => {
      fileData.content = [];
      dataMenu.displayLocalData(fileData);

      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        "Node contains no datasets.",
      );
    });

    it("shows details for each entry (protected)", () => {
      dataMenu.displayLocalData(fileData);

      expect(mockUiService.showInfoMessage).toHaveBeenCalledWith(
        `File 1 of 1\n\n` +
          `Filename: ${filename}\n` +
          `CID: ${cid}\n` +
          `Size: ${(datasetSize / 1024).toFixed(2)} KB\n` +
          `MIME Type: ${mimetype}\n` +
          `Protected: Yes`,
      );
    });
  });
});
