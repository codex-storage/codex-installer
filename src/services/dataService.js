import { Codex } from "@codex-storage/sdk-js";
import { NodeUploadStategy } from "@codex-storage/sdk-js/node";
import mime from "mime-types";
import path from "path";
import fs from "fs";

export class DataService {
  constructor(configService) {
    this.configService = configService;
  }

  upload = async (filePath) => {
    const data = this.getCodexData();
    const filename = path.basename(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";
    const fileData = fs.readFileSync(filePath);

    const strategy = new NodeUploadStategy(fileData, {
      filename: filename,
      mimetype: contentType,
    });
    const uploadResponse = data.upload(strategy);
    const res = await uploadResponse.result;

    if (res.error) {
      throw new Exception(res.data);
    }
    return res.data;
  };

  download = async (cid) => {
    const data = this.getCodexData();
    const manifest = await data.fetchManifest(cid);
    const filename = this.getFilename(manifest);

    const response = await data.networkDownloadStream(cid);
    const fileData = response.data;

    fs.writeFileSync(filename, fileData);
  };

  getCodexData = () => {
    const config = this.configService.get();
    const url = `http://localhost:${config.ports.apiPort}`;
    const codex = new Codex(url);
    return codex.data;
  };

  getFilename = (manifest) => {
    const defaultFilename = "unknown_" + Math.random();
    const filename = manifest?.data?.manifest?.filename;

    if (filename == undefined || filename.length < 1) return defaultFilename;
    return filename;
  };
}
