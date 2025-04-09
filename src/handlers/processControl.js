export class ProcessControl {
  constructor(configService, shellService, osService, fsService) {
    this.config = configService.get();
    this.shell = shellService;
    this.os = osService;
    this.fs = fsService;
  }

  getPublicIp = async () => {
    if (this.os.isWindows()) {
      const result = await this.shell.run(
        "for /f \"delims=\" %a in ('curl -s --ssl-reqd ip.codex.storage') do @echo %a",
      );
      return result.trim();
    } else {
      return await this.shell.run("curl -s https://ip.codex.storage");
    }
  }

  getLogFile = () =>{
    // function getCurrentLogFile(config) {
    //   const timestamp = new Date()
    //     .toISOString()
    //     .replaceAll(":", "-")
    //     .replaceAll(".", "-");
    //   return path.join(config.logsDir, `codex_${timestamp}.log`);
    // }
    // todo, maybe use timestamp

    return this.fs.pathJoin([this.config.logsDir, "codex.log"]);
  }

  doThing = async () => {
    if (this.config.dataDir.length < 1) throw new Error("Missing config: dataDir");
    if (this.config.logsDir.length < 1) throw new Error("Missing config: logsDir");

    console.log("start a codex detached");

    console.log("nat: " + await this.getPublicIp());
    console.log("logs dir: " + this.getLogFile());

    try {
      


      console.log(
        showInfoMessage(
          `Data location: ${config.dataDir}\n` +
            `Logs: ${logFilePath}\n` +
            `API port: ${config.ports.apiPort}`,
        ),
      );

      const executable = config.codexExe;
      const args = [
        `--data-dir="${config.dataDir}"`,
        `--log-level=DEBUG`,
        `--log-file="${logFilePath}"`,
        `--storage-quota="${config.storageQuota}"`,
        `--disc-port=${config.ports.discPort}`,
        `--listen-addrs=/ip4/0.0.0.0/tcp/${config.ports.listenPort}`,
        `--api-port=${config.ports.apiPort}`,
        `--nat=${nat}`,
        `--api-cors-origin="*"`,
        `--bootstrap-node=spr:CiUIAhIhAiJvIcA_ZwPZ9ugVKDbmqwhJZaig5zKyLiuaicRcCGqLEgIDARo8CicAJQgCEiECIm8hwD9nA9n26BUoNuarCEllqKDnMrIuK5qJxFwIaosQ3d6esAYaCwoJBJ_f8zKRAnU6KkYwRAIgM0MvWNJL296kJ9gWvfatfmVvT-A7O2s8Mxp8l9c8EW0CIC-h-H-jBVSgFjg3Eny2u33qF7BDnWFzo7fGfZ7_qc9P`,
      ];

      const command = `"${executable}" ${args.join(" ")}`;

      console.log(
        showInfoMessage(
          "🚀 Codex node is running...\n\n" +
            "If your firewall ask, be sure to allow Codex to receive connections. \n" +
            "Please keep this terminal open. Start a new terminal to interact with the node.\n\n" +
            "Press CTRL+C to stop the node",
        ),
      );

      const nodeProcess = exec(command);

      await new Promise((resolve) => setTimeout(resolve, 5000));
        
      }
      catch 
      {

      }
    }
}
