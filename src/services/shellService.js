import { exec, spawn } from "child_process";
import { promisify } from "util";

export class ShellService {
  constructor() {
    this.execAsync = promisify(exec);
  }

  run = async (command) => {
    try {
      const { stdout, stderr } = await this.execAsync(command);
      return stdout;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  };

  spawnDetachedProcess = async (cmd, workingDir, args) => {
    var child = spawn(cmd, args, {
      cwd: workingDir,
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
    });

    // child.stdout.on("data", (data) => {
    //   console.log(`stdout: ${data}`);
    // });

    // child.stderr.on("data", (data) => {
    //   console.error(`stderr: ${data}`);
    // });

    // child.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    // });

    child.unref();

    await new Promise((resolve) => setTimeout(resolve, 2000));
  };
}
