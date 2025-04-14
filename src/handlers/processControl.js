import fs from "fs";
import { spawn, exec } from "child_process";

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
    console.log("data dir: " + this.config.dataDir);
    console.log("api port: " + this.config.ports.apiPort);
    console.log("codex exe: " + this.config.codexExe);
    console.log("quota: " + this.config.storageQuota);

    const executable = this.config.codexExe;
    const args = [
      `--data-dir=${this.config.dataDir}`,
      // `--log-level=DEBUG`,
      // `--log-file="${this.getLogFile()}"`,
      `--storage-quota=${this.config.storageQuota}`,
      `--disc-port=${this.config.ports.discPort}`,
      `--listen-addrs=/ip4/0.0.0.0/tcp/${this.config.ports.listenPort}`,
      `--api-port=${this.config.ports.apiPort}`,
      `--nat=extip:${await this.getPublicIp()}`,
      `--api-cors-origin="*"`,
      `--bootstrap-node=spr:CiUIAhIhAiJvIcA_ZwPZ9ugVKDbmqwhJZaig5zKyLiuaicRcCGqLEgIDARo8CicAJQgCEiECIm8hwD9nA9n26BUoNuarCEllqKDnMrIuK5qJxFwIaosQ3d6esAYaCwoJBJ_f8zKRAnU6KkYwRAIgM0MvWNJL296kJ9gWvfatfmVvT-A7O2s8Mxp8l9c8EW0CIC-h-H-jBVSgFjg3Eny2u33qF7BDnWFzo7fGfZ7_qc9P`,
    ];

    const command = `"${executable}" ${args.join(" ")}`;
    console.log("command: " + command);
    console.log("\n\n");

    var child = spawn(executable, args, { detached: true, stdio: ['ignore', 'ignore', 'ignore']});
    child.unref();

    await new Promise((resolve) => setTimeout(resolve, 2000));
    return;
  }
}
