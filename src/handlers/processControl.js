export class ProcessControl {
  constructor(configService, shellService, osService, fsService, codexGlobals) {
    this.configService = configService;
    this.config = configService.get();
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
      return processes.filter((p) => p.name === "codex");
    }
  };

  getNumberOfCodexProcesses = async () => {
    return (await this.getCodexProcesses()).length;
  };

  stopCodexProcess = async () => {
    const processes = await this.getCodexProcesses();
    if (processes.length < 1) throw new Error("No codex process found");

    const pid = processes[0].pid;
    process.kill(pid, "SIGINT");
    await this.sleep();
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
    const executable = this.config.codexExe;
    const args = [`--config-file=${this.config.codexConfigFilePath}`];
    await this.shell.spawnDetachedProcess(executable, args);
  };
}
