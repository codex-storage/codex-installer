import fs from "fs";
import { spawn, exec } from "child_process";

export class ProcessControl {
  constructor(configService, shellService, osService, fsService) {
    this.configService = configService;
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
  };

  doThing = async () => {
    if (this.config.dataDir.length < 1)
      throw new Error("Missing config: dataDir");
    if (this.config.logsDir.length < 1)
      throw new Error("Missing config: logsDir");

    console.log("start a codex detached");

    const executable = this.config.codexExe;
    const args = [`--config-file=${this.config.codexConfigFilePath}`];
    const bootstrapNodes = [
      "spr:CiUIAhIhAiJvIcA_ZwPZ9ugVKDbmqwhJZaig5zKyLiuaicRcCGqLEgIDARo8CicAJQgCEiECIm8hwD9nA9n26BUoNuarCEllqKDnMrIuK5qJxFwIaosQ3d6esAYaCwoJBJ_f8zKRAnU6KkYwRAIgM0MvWNJL296kJ9gWvfatfmVvT-A7O2s8Mxp8l9c8EW0CIC-h-H-jBVSgFjg3Eny2u33qF7BDnWFzo7fGfZ7_qc9P",
    ];
    const publicIp = await this.getPublicIp();

    this.configService.writeCodexConfigFile(publicIp, bootstrapNodes);

    const command = `"${executable}" ${args.join(" ")}`;
    console.log("command: " + command);
    console.log("\n\n");

    var child = spawn(executable, args, {
      detached: true,
      //stdio: ["ignore", "ignore", "ignore"],
    });

    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });

    child.unref();

    await new Promise((resolve) => setTimeout(resolve, 2000));
    return;
  };
}
