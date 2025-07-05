import { describe, beforeEach, it, expect, vi } from "vitest";
import {
  mockShellService,
  mockOsService,
  mockFsService,
  mockCodexGlobals,
} from "../__mocks__/service.mocks.js";
import { mockConfigService } from "../__mocks__/service.mocks.js";
import { ProcessControl } from "./processControl.js";

describe("ProcessControl", () => {
  let processControl;
  const mockEthProvider = "mockEthProvider";

  beforeEach(() => {
    vi.resetAllMocks();
    mockCodexGlobals.getEthProvider.mockReturnValue(mockEthProvider);

    processControl = new ProcessControl(
      mockConfigService,
      mockShellService,
      mockOsService,
      mockFsService,
      mockCodexGlobals,
    );

    processControl.sleep = vi.fn();
  });

  describe("getCodexProcesses", () => {
    const processes = [
      { id: 0, name: "a.exe", cmd: "" },
      { id: 1, name: "codex", cmd: "<defunct>" },
      { id: 2, name: "codex", cmd: "" },
      { id: 3, name: "codex.exe", cmd: "<defunct>" },
      { id: 4, name: "notcodex", cmd: "" },
      { id: 5, name: "alsonotcodex.exe", cmd: "" },
    ];

    beforeEach(() => {
      mockOsService.listProcesses.mockResolvedValue(processes);
    });

    it("returns codex.exe processes on windows", async () => {
      mockOsService.isWindows.mockReturnValue(true);

      const p = await processControl.getCodexProcesses();

      expect(p.length).toBe(1);
      expect(p[0]).toBe(processes[3]);
    });

    it("returns codex processes on non-windows", async () => {
      mockOsService.isWindows.mockReturnValue(false);

      const p = await processControl.getCodexProcesses();

      expect(p.length).toBe(1);
      expect(p[0]).toBe(processes[2]);
    });
  });

  describe("getNumberOfCodexProcesses", () => {
    it("counts the results of getCodexProcesses", async () => {
      processControl.getCodexProcesses = vi.fn();
      processControl.getCodexProcesses.mockResolvedValue(["a", "b", "c"]);

      expect(await processControl.getNumberOfCodexProcesses()).toBe(3);
    });
  });

  describe("stopCodexProcess", () => {
    beforeEach(() => {
      processControl.getCodexProcesses = vi.fn();
    });

    it("throws when no codex processes are found", async () => {
      processControl.getCodexProcesses.mockResolvedValue([]);

      await expect(processControl.stopCodexProcess).rejects.toThrow(
        "No codex process found",
      );
    });

    it("calls stopProcess with pid of first codex process", async () => {
      const pid = 12345;
      processControl.getCodexProcesses.mockResolvedValue([
        { pid: pid },
        { pid: 111 },
        { pid: 222 },
      ]);

      processControl.stopProcess = vi.fn();
      await processControl.stopCodexProcess();

      expect(processControl.stopProcess).toHaveBeenCalledWith(pid);
    });
  });

  describe("stopProcess", () => {
    const pid = 234;
    beforeEach(() => {
      processControl.isProcessRunning = vi.fn();
    });

    it("stops the process", async () => {
      processControl.isProcessRunning.mockResolvedValue(false);

      await processControl.stopProcess(pid);

      expect(mockOsService.stopProcess).toHaveBeenCalledWith(pid);
    });

    it("sleeps", async () => {
      processControl.isProcessRunning.mockResolvedValue(false);

      await processControl.stopProcess(pid);

      expect(processControl.sleep).toHaveBeenCalled();
    });

    it("terminates process if it is running after stop", async () => {
      processControl.isProcessRunning.mockResolvedValue(true);

      await processControl.stopProcess(pid);

      expect(mockOsService.terminateProcess).toHaveBeenCalledWith(pid);
    });
  });

  describe("isProcessRunning", () => {
    const pid = 345;

    it("is true when process is in process list", async () => {
      mockOsService.listProcesses.mockResolvedValue([{ pid: pid }]);

      expect(await processControl.isProcessRunning(pid)).toBeTruthy();
    });

    it("is false when process is not in process list", async () => {
      mockOsService.listProcesses.mockResolvedValue([{ pid: pid + 11 }]);

      expect(await processControl.isProcessRunning(pid)).toBeFalsy();
    });
  });

  describe("startCodexProcess", () => {
    beforeEach(() => {
      processControl.saveCodexConfigFile = vi.fn();
      processControl.startCodex = vi.fn();
    });

    it("saves the config, starts codex, and sleeps", async () => {
      await processControl.startCodexProcess();

      expect(processControl.saveCodexConfigFile).toHaveBeenCalled();
      expect(processControl.startCodex).toHaveBeenCalled();
      expect(processControl.sleep).toHaveBeenCalled();
    });
  });

  describe("saveCodexConfigFile", () => {
    const publicIp = "1.2.3.4";
    const bootNodes = ["a", "b", "c"];

    beforeEach(() => {
      mockCodexGlobals.getPublicIp.mockResolvedValue(publicIp);
      mockCodexGlobals.getTestnetSPRs.mockResolvedValue(bootNodes);
    });

    it("writes codex config file using public IP and testnet bootstrap nodes", async () => {
      await processControl.saveCodexConfigFile();

      expect(mockConfigService.writeCodexConfigFile).toHaveBeenCalledWith(
        publicIp,
        bootNodes,
      );
    });
  });

  describe("startCodex", () => {
    const config = {
      codexRoot: "/codex-root",
    };
    const exe = "abc.exe";
    const configFile = "/codex/config.toml";

    beforeEach(() => {
      mockConfigService.getCodexExe.mockReturnValue(exe);
      mockConfigService.get.mockReturnValue(config);
      mockConfigService.getCodexConfigFilePath.mockReturnValue(configFile);
    });

    it("spawns a detached codex process in the codex root working directory with the config file as argument", async () => {
      await processControl.startCodex();

      expect(mockShellService.spawnDetachedProcess).toHaveBeenCalledWith(
        exe,
        config.codexRoot,
        [
          `--config-file=${configFile}`,
          "persistence",
          `--eth-provider=${mockEthProvider}`,
          `--eth-private-key=eth.key`, // duplicated in configService.
        ],
      );
    });
  });
});
