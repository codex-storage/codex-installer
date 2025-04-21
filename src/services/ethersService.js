import { ethers } from 'ethers';
import crypto from "crypto";

export class EthersService {
  constructor(fsService, configService) {
    this.fs = fsService;
    this.configService = configService;
  }

  getOrCreateEthKey = () => {
    const paths = this.configService.getEthFilePaths();

    if (!this.fs.isFile(paths.key)) {
      this.generateAndSaveKey(paths);
    }

    const address = this.fs.readFile(paths.address);

    return {
      privateKeyFilePath: paths.key,
      addressFilePath: paths.address,
      address: address,
    };
  };

  generateAndSaveKey = async (paths) => {
    const keys = this.generateKey();
    this.fs.writeFile(paths.key, keys.key);
    this.fs.writeFile(paths.address, keys.address);
  };

  generateKey = () => {
    var id = crypto.randomBytes(32).toString("hex");
    var privateKey = "0x" + id;
    var wallet = new ethers.Wallet(privateKey);
    return {
      key: privateKey,
      address: wallet.address,
    };
  };
}
