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

  beforeEach(() => {
    vi.resetAllMocks();

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
      { id: 0, name: "a.exe" },
      { id: 1, name: "aaa" },
      { id: 2, name: "codex" },
      { id: 3, name: "codex.exe" },
      { id: 4, name: "notcodex" },
      { id: 5, name: "alsonotcodex.exe" },
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

    it("stops the first codex process", async () => {
      const pid = 12345;
      processControl.getCodexProcesses.mockResolvedValue([
        { pid: pid },
        { pid: 111 },
        { pid: 222 },
      ]);

      await processControl.stopCodexProcess();

      expect(mockOsService.stopProcess).toHaveBeenCalledWith(pid);
    });

    it("sleeps", async () => {
      processControl.getCodexProcesses.mockResolvedValue([
        { pid: 111 },
        { pid: 222 },
      ]);

      await processControl.stopCodexProcess();

      expect(processControl.sleep).toHaveBeenCalled();
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
        [`--config-file=${configFile}`],
      );
    });
  });
});
