export class Installer {
  constructor(configService, shellService, osService, fsService) {
    this.config = configService.get();
    this.configService = configService;
    this.shell = shellService;
    this.os = osService;
    this.fs = fsService;
  }

  isCodexInstalled = async () => {
    try {
      await this.getCodexVersion();
      return true;
    } catch (error) {
      return false;
    }
  };

  getCodexVersion = async () => {
    if (this.config.codexExe.length < 1)
      throw new Error("Codex not installed.");
    const version = await this.shell.run(`"${this.config.codexExe}" --version`);
    if (version.length < 1) throw new Error("Version info not found.");
    return version;
  };

  installCodex = async (processCallbacks) => {
    if (!(await this.arePrerequisitesCorrect(processCallbacks))) return;

    processCallbacks.installStarts();
    if (this.os.isWindows()) {
      await this.installCodexWindows(processCallbacks);
    } else {
      await this.installCodexUnix(processCallbacks);
    }

    if (!(await this.isCodexInstalled()))
      throw new Error("Codex installation failed.");
    processCallbacks.installSuccessful();
  };

  uninstallCodex = () => {
    this.fs.deleteDir(this.config.codexInstallPath);
    this.fs.deleteDir(this.config.dataDir);
  };

  arePrerequisitesCorrect = async (processCallbacks) => {
    if (await this.isCodexInstalled()) {
      processCallbacks.warn("Codex is already installed.");
      return false;
    }
    if (this.config.codexInstallPath.length < 1) {
      processCallbacks.warn("Install path not set.");
      return false;
    }
    if (!(await this.isCurlAvailable())) {
      processCallbacks.warn("Curl is not available.");
      return false;
    }
    return true;
  };

  isCurlAvailable = async () => {
    const curlVersion = await this.shell.run("curl --version");
    return curlVersion.length > 0;
  };

  installCodexWindows = async (processCallbacks) => {
    await this.shell.run(
      "curl -LO --ssl-no-revoke https://get.codex.storage/install.cmd",
    );
    processCallbacks.downloadSuccessful();
    await this.shell.run(
      `set "INSTALL_DIR=${this.config.codexInstallPath}" && ` +
        `"${this.os.getWorkingDir()}\\install.cmd"`,
    );
    await this.saveCodexInstallPath("codex.exe");
    await this.shell.run("del /f install.cmd");
  };

  installCodexUnix = async (processCallbacks) => {
    if (!(await this.ensureUnixDependencies(processCallbacks))) return;
    await this.shell.run(
      "curl -# --connect-timeout 10 --max-time 60 -L https://get.codex.storage/install.sh -o install.sh && chmod +x install.sh",
    );
    processCallbacks.downloadSuccessful();

    if (this.os.isDarwin()) {
      await this.runInstallerDarwin();
    } else {
      await this.runInstallerLinux();
    }

    await this.saveCodexInstallPath("codex");
    await this.shell.run("rm -f install.sh");
  };

  runInstallerDarwin = async () => {
    const timeoutCommand = `perl -e '
    eval {
        local $SIG{ALRM} = sub { die "timeout\\n" };
        alarm(120);
        system("INSTALL_DIR=\\"${this.config.codexInstallPath}\\" bash install.sh");
        alarm(0);
    };
    die if $@;
'`;
    await this.shell.run(timeoutCommand);
  };

  runInstallerLinux = async () => {
    await this.shell.run(
      `INSTALL_DIR="${this.config.codexInstallPath}" timeout 120 bash install.sh`,
    );
  };

  ensureUnixDependencies = async (processCallbacks) => {
    const libgompCheck = await this.shell.run("ldconfig -p | grep libgomp");
    if (libgompCheck.length < 1) {
      processCallbacks.warn("libgomp not found.");
      return false;
    }
    return true;
  };

  saveCodexInstallPath = async (codexExe) => {
    this.config.codexExe = this.fs.pathJoin([
      this.config.codexInstallPath,
      codexExe,
    ]);
    if (!this.fs.isFile(this.config.codexExe))
      throw new Error("Codex executable not found.");
    await this.configService.saveConfig();
  };
}
