import os from "os";
import psList from "ps-list";

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

  listProcesses = async () => {
    return await psList();
  };

  stopProcess = (pid) => {
    process.kill(pid, "SIGINT");
  };

  terminateProcess = (pid) => {
    process.kill(pid, "SIGTERM");
  }
}
