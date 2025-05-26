import { Codex } from "@codex-storage/sdk-js";
import { NodeUploadStategy } from "@codex-storage/sdk-js/node";
import path from "path";
import fs from "fs";

export class DataService {
  constructor(configService) {
    this.configService = configService;
  }

  upload = async (filePath) => {
    const data = this.getCodexData();

    // We can use mime util to determine the content type of the file. But Codex will reject some
    // mimetypes. So we set it to octet-stream always.
    const contentType = "application/octet-stream";

    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const metadata = { filename: filename, mimetype: contentType };

    const strategy = new NodeUploadStategy(fileData, metadata);
    const uploadResponse = data.upload(strategy);
    const res = await uploadResponse.result;

    if (res.error) {
      throw new Error(res.data);
    }
    return res.data;
  };

  download = async (cid) => {
    throw new Error("Waiting for fix of codex-js sdk");

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
