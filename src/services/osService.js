import os from "os";

export class OsService {
  constructor() {
    this.platform = os.platform();
  }

  isWindows = () => {
    return this.platform === "win32";
  };

  isDarwin = () => {
    return this.platform === "darwin";
  };

  isLinux = () => {
    return this.platform === "linux";
  };

  getWorkingDir = () => {
    return process.cwd();
  };
}
