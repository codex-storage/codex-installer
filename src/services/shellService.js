import { exec } from "child_process";
import { promisify } from "util";

export class ShellService {
  constructor() {
    this.execAsync = promisify(exec);
  }

  async run(command) {
    try {
      const { stdout, stderr } = await this.execAsync(command);
      return stdout;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  }
}
