export class ProcessControl {
  constructor(configService, shellService, osService, fsService, codexGlobals) {
    this.configService = configService;
    this.shell = shellService;
    this.os = osService;
    this.fs = fsService;
    this.codexGlobals = codexGlobals;
  }

  getCodexProcesses = async () => {
    const processes = await this.os.listProcesses();
    if (this.os.isWindows()) {
      return processes.filter((p) => p.name === "codex.exe");
    } else {
      return processes.filter(
        (p) => p.name === "codex" && !p.cmd.includes("<defunct>"),
      );
    }
  };

  getNumberOfCodexProcesses = async () => {
    return (await this.getCodexProcesses()).length;
  };

  stopCodexProcess = async () => {
    const processes = await this.getCodexProcesses();
    if (processes.length < 1) throw new Error("No codex process found");

    const pid = processes[0].pid;
    await this.stopProcess(pid);
  };

  stopProcess = async (pid) => {
    this.os.stopProcess(pid);
    await this.sleep();

    if (await this.isProcessRunning(pid)) {
      this.os.terminateProcess(pid);
      await this.sleep();
    }
  };

  isProcessRunning = async (pid) => {
    const processes = await this.os.listProcesses();
    const p = processes.filter((p) => p.pid == pid);
    const result = p.length > 0;
    return result;
  };

  startCodexProcess = async () => {
    await this.saveCodexConfigFile();
    await this.startCodex();
    await this.sleep();
  };

  sleep = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  };

  saveCodexConfigFile = async () => {
    const publicIp = await this.codexGlobals.getPublicIp();
    const bootstrapNodes = await this.codexGlobals.getTestnetSPRs();
    this.configService.writeCodexConfigFile(publicIp, bootstrapNodes);
  };

  startCodex = async () => {
    const executable = this.configService.getCodexExe();
    const workingDir = this.configService.get().codexRoot;
    const args = [
      `--config-file=${this.configService.getCodexConfigFilePath()}`,

      // Marketplace client parameters cannot be set via config file.
      // Open issue: https://github.com/codex-storage/nim-codex/issues/1206
      // So we're setting them here.
      "persistence",
      `--eth-provider=${this.codexGlobals.getEthProvider()}`,
      `--eth-private-key=eth.key`, // duplicated in configService.
    ];
    await this.shell.spawnDetachedProcess(executable, workingDir, args);
  };
}
