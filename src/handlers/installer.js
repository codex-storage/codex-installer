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
    const codexExe = this.configService.getCodexExe();
    if (!this.fs.isFile(codexExe)) throw new Error("Codex not installed.");
    const version = await this.shell.run(`"${codexExe}" --version`);
    if (version.length < 1) throw new Error("Version info not found.");
    return version;
  };

  installCodex = async (processCallbacks) => {
    this.fs.ensureDirExists(this.config.codexRoot);
    if (!(await this.arePrerequisitesCorrect(processCallbacks))) return;

    processCallbacks.installStarts();
    if (this.os.isWindows()) {
      await this.installCodexWindows(processCallbacks);
    } else {
      await this.installCodexUnix(processCallbacks);
    }

    if (!(await this.isCodexInstalled())) {
      processCallbacks.warn("Codex failed to install.");
      throw new Error("Codex installation failed.");
    }
    processCallbacks.installSuccessful();
  };

  uninstallCodex = () => {
    this.fs.deleteDir(this.config.codexRoot);
  };

  arePrerequisitesCorrect = async (processCallbacks) => {
    if (await this.isCodexInstalled()) {
      processCallbacks.warn("Codex is already installed.");
      return false;
    }
    if (!this.fs.isDir(this.config.codexRoot)) {
      processCallbacks.warn("Root path doesn't exist.");
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
      `set "INSTALL_DIR=${this.config.codexRoot}" && ` +
        `"${this.os.getWorkingDir()}\\install.cmd"`,
    );
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
    await this.shell.run("rm -f install.sh");
  };

  runInstallerDarwin = async () => {
    const timeoutCommand = `perl -e '
    eval {
        local $SIG{ALRM} = sub { die "timeout\\n" };
        alarm(120);
        system("INSTALL_DIR=\\"${this.config.codexRoot}\\" bash install.sh");
        alarm(0);
    };
    die if $@;
'`;
    await this.shell.run(timeoutCommand);
  };

  runInstallerLinux = async () => {
    await this.shell.run(
      `INSTALL_DIR="${this.config.codexRoot}" timeout 120 bash install.sh`,
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
}
