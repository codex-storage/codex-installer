import { ethers } from "ethers";
import crypto from "crypto";

export class EthersService {
  constructor(fsService, configService, osService, shellService) {
    this.fs = fsService;
    this.configService = configService;
    this.os = osService;
    this.shell = shellService;
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

    if (this.os.isWindows()) {
      const username = this.os.getUsername();
      this.shell.run(`icacls ${paths.key} /inheritance:r >nul 2>&1`);
      this.shell.run(`icacls ${paths.key} /grant:r ${username}:F >nul 2>&1`);
      this.shell.run(`icacls ${paths.key} /remove SYSTEM >nul 2>&1`);
      this.shell.run(`icacls ${paths.key} /remove Administrators >nul 2>&1`);
    } else {
      this.shell.run(`chmod 600 "${paths.key}"`);
    }
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
