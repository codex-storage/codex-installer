import { describe, beforeEach, it, expect, vi } from "vitest";
import {
  mockShellService,
  mockOsService,
  mockFsService,
} from "../__mocks__/service.mocks.js";
import { mockConfigService } from "../__mocks__/service.mocks.js";
import { Installer } from "./installer.js";

describe("Installer", () => {
  const config = {
    codexInstallPath: "/install-codex",
  };
  const workingDir = "/working-dir";
  const processCallbacks = {
    installStarts: vi.fn(),
    downloadSuccessful: vi.fn(),
    installSuccessful: vi.fn(),
    warn: vi.fn(),
  };
  let installer;

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfigService.get.mockReturnValue(config);
    mockOsService.getWorkingDir.mockReturnValue(workingDir);

    installer = new Installer(
      mockConfigService,
      mockShellService,
      mockOsService,
      mockFsService,
    );
  });

  describe("getCodexVersion", () => {
    it("throws when codex exe is not set", async () => {
      config.codexExe = "";
      await expect(installer.getCodexVersion()).rejects.toThrow(
        "Codex not installed.",
      );
    });

    it("throws when version info is not found", async () => {
      config.codexExe = "codex.exe";
      mockShellService.run.mockResolvedValueOnce("");
      await expect(installer.getCodexVersion()).rejects.toThrow(
        "Version info not found.",
      );
    });

    it("returns version info", async () => {
      const versionInfo = "versionInfo";
      config.codexExe = "codex.exe";
      mockShellService.run.mockResolvedValueOnce(versionInfo);
      const version = await installer.getCodexVersion();
      expect(version).toBe(versionInfo);
    });
  });

  describe("isCodexInstalled", () => {
    it("return true when getCodexVersion succeeds", async () => {
      installer.getCodexVersion = vi.fn();
      expect(await installer.isCodexInstalled()).toBe(true);
    });

    it("returns false when getCodexVersion fails", async () => {
      installer.getCodexVersion = vi.fn(() => {
        throw new Error("Codex not installed.");
      });
      expect(await installer.isCodexInstalled()).toBe(false);
    });
  });

  describe("installCodex", () => {
    beforeEach(() => {
      installer.arePrerequisitesCorrect = vi.fn();
      installer.installCodexWindows = vi.fn();
      installer.installCodexUnix = vi.fn();
      installer.isCodexInstalled = vi.fn();
    });

    it("returns early when prerequisites are not correct", async () => {
      installer.arePrerequisitesCorrect.mockResolvedValue(false);
      await installer.installCodex(processCallbacks);
      expect(processCallbacks.installStarts).not.toHaveBeenCalled();
      expect(processCallbacks.installSuccessful).not.toHaveBeenCalled();
      expect(processCallbacks.downloadSuccessful).not.toHaveBeenCalled();
      expect(installer.isCodexInstalled).not.toHaveBeenCalled();
      expect(installer.installCodexWindows).not.toHaveBeenCalled();
      expect(installer.installCodexUnix).not.toHaveBeenCalled();
    });

    describe("prerequisites OK", () => {
      beforeEach(() => {
        installer.arePrerequisitesCorrect.mockResolvedValue(true);
        installer.isCodexInstalled.mockResolvedValue(true);
      });

      it("calls installStarts when prerequisites are correct", async () => {
        await installer.installCodex(processCallbacks);
        expect(processCallbacks.installStarts).toHaveBeenCalled();
      });

      it("calls installCodexWindows when OS is Windows", async () => {
        mockOsService.isWindows.mockReturnValue(true);
        await installer.installCodex(processCallbacks);
        expect(installer.installCodexWindows).toHaveBeenCalledWith(
          processCallbacks,
        );
      });

      it("calls installCodexUnix when OS is not Windows", async () => {
        mockOsService.isWindows.mockReturnValue(false);
        await installer.installCodex(processCallbacks);
        expect(installer.installCodexUnix).toHaveBeenCalledWith(
          processCallbacks,
        );
      });

      it("throws when codex is not installed after installation", async () => {
        installer.isCodexInstalled.mockResolvedValue(false);
        await expect(installer.installCodex(processCallbacks)).rejects.toThrow(
          "Codex installation failed.",
        );
      });

      it("calls installSuccessful when installation is successful", async () => {
        await installer.installCodex(processCallbacks);
        expect(processCallbacks.installSuccessful).toHaveBeenCalled();
      });
    });
  });

  describe("arePrerequisitesCorrect", () => {
    beforeEach(() => {
      installer.isCodexInstalled = vi.fn();
      installer.isCurlAvailable = vi.fn();
      config.codexInstallPath = "/install-codex";
    });

    it("returns false when codex is already installed", async () => {
      installer.isCodexInstalled.mockResolvedValue(true);
      expect(await installer.arePrerequisitesCorrect(processCallbacks)).toBe(
        false,
      );
      expect(processCallbacks.warn).toHaveBeenCalledWith(
        "Codex is already installed.",
      );
    });

    it("returns false when install path is not set", async () => {
      config.codexInstallPath = "";
      expect(await installer.arePrerequisitesCorrect(processCallbacks)).toBe(
        false,
      );
      expect(processCallbacks.warn).toHaveBeenCalledWith(
        "Install path not set.",
      );
    });

    it("returns false when curl is not available", async () => {
      installer.isCodexInstalled.mockResolvedValue(false);
      installer.isCurlAvailable.mockResolvedValue(false);
      expect(await installer.arePrerequisitesCorrect(processCallbacks)).toBe(
        false,
      );
      expect(processCallbacks.warn).toHaveBeenCalledWith(
        "Curl is not available.",
      );
    });

    it("returns true when all prerequisites are correct", async () => {
      installer.isCodexInstalled.mockResolvedValue(false);
      installer.isCurlAvailable.mockResolvedValue(true);
      const result = await installer.arePrerequisitesCorrect(processCallbacks);
      expect(result).toBe(true);
    });
  });

  describe("isCurlAvailable", () => {
    it("returns true when curl version is found", async () => {
      mockShellService.run.mockResolvedValueOnce("curl version");
      const result = await installer.isCurlAvailable();
      expect(mockShellService.run).toHaveBeenCalledWith("curl --version");
      expect(result).toBe(true);
    });

    it("returns false when curl version is not found", async () => {
      mockShellService.run.mockResolvedValueOnce("");
      const result = await installer.isCurlAvailable();
      expect(mockShellService.run).toHaveBeenCalledWith("curl --version");
      expect(result).toBe(false);
    });
  });

  describe("install functions", () => {
    beforeEach(() => {
      installer.saveCodexInstallPath = vi.fn();
    });

    describe("installCodexWindows", () => {
      it("runs the curl command to download the installer", async () => {
        await installer.installCodexWindows(processCallbacks);
        expect(mockShellService.run).toHaveBeenCalledWith(
          "curl -LO --ssl-no-revoke https://get.codex.storage/install.cmd",
        );
      });

      it("calls downloadSuccessful", async () => {
        await installer.installCodexWindows(processCallbacks);
        expect(processCallbacks.downloadSuccessful).toHaveBeenCalled();
      });

      it("runs installer script", async () => {
        await installer.installCodexWindows(processCallbacks);
        expect(mockShellService.run).toHaveBeenCalledWith(
          `set "INSTALL_DIR=${config.codexInstallPath}" && "${workingDir}\\install.cmd"`,
        );
      });

      it("saves the codex install path", async () => {
        await installer.installCodexWindows(processCallbacks);
        expect(installer.saveCodexInstallPath).toHaveBeenCalledWith(
          "codex.exe",
        );
      });

      it("deletes the installer script", async () => {
        await installer.installCodexWindows(processCallbacks);
        expect(mockShellService.run).toHaveBeenCalledWith("del /f install.cmd");
      });
    });

    describe("installCodexUnix", () => {
      beforeEach(() => {
        installer.ensureUnixDependencies = vi.fn();
        installer.runInstallerDarwin = vi.fn();
        installer.runInstallerLinux = vi.fn();
      });

      it("ensures unix dependencies", async () => {
        await installer.installCodexUnix(processCallbacks);
        expect(installer.ensureUnixDependencies).toHaveBeenCalled(
          processCallbacks,
        );
      });

      it("returns early if unix dependencies are not met", async () => {
        installer.ensureUnixDependencies.mockResolvedValue(false);

        await installer.installCodexUnix(processCallbacks);

        expect(processCallbacks.downloadSuccessful).not.toHaveBeenCalled();
        expect(installer.runInstallerDarwin).not.toHaveBeenCalled();
        expect(installer.runInstallerLinux).not.toHaveBeenCalled();
      });

      describe("when dependencies are met", () => {
        beforeEach(() => {
          installer.ensureUnixDependencies.mockResolvedValue(true);
        });

        it("runs the curl command to download the installer", async () => {
          await installer.installCodexUnix(processCallbacks);
          expect(mockShellService.run).toHaveBeenCalledWith(
            "curl -# --connect-timeout 10 --max-time 60 -L https://get.codex.storage/install.sh -o install.sh && chmod +x install.sh",
          );
        });

        it("calls downloadSuccessful", async () => {
          await installer.installCodexUnix(processCallbacks);
          expect(processCallbacks.downloadSuccessful).toHaveBeenCalled();
        });

        it("runs installer for darwin ", async () => {
          mockOsService.isDarwin.mockReturnValue(true);
          await installer.installCodexUnix(processCallbacks);
          expect(installer.runInstallerDarwin).toHaveBeenCalled();
        });

        it("runs installer for linux", async () => {
          mockOsService.isDarwin.mockReturnValue(false);
          await installer.installCodexUnix(processCallbacks);
          expect(installer.runInstallerLinux).toHaveBeenCalled();
        });

        it("saves the codex install path", async () => {
          await installer.installCodexUnix(processCallbacks);
          expect(installer.saveCodexInstallPath).toHaveBeenCalledWith("codex");
        });

        it("deletes the installer script", async () => {
          await installer.installCodexUnix(processCallbacks);
          expect(mockShellService.run).toHaveBeenCalledWith("rm -f install.sh");
        });
      });
    });

    describe("runInstallerDarwin", () => {
      it("runs the installer script for darwin with custom timeout command", async () => {
        const timeoutCommand = `perl -e '
    eval {
        local $SIG{ALRM} = sub { die "timeout\\n" };
        alarm(120);
        system("INSTALL_DIR=\\"${config.codexInstallPath}\\" bash install.sh");
        alarm(0);
    };
    die if $@;
'`;
        await installer.runInstallerDarwin();
        expect(mockShellService.run).toHaveBeenCalledWith(timeoutCommand);
      });
    });

    describe("runInstallerLinux", () => {
      it("runs the installer script using unix timeout command", async () => {
        await installer.runInstallerLinux();
        expect(mockShellService.run).toHaveBeenCalledWith(
          `INSTALL_DIR="${config.codexInstallPath}" timeout 120 bash install.sh`,
        );
      });
    });
  });

  describe("ensureUnixDependencies", () => {
    it("returns true when libgomp is installed", async () => {
      mockShellService.run.mockResolvedValueOnce("yes");
      expect(await installer.ensureUnixDependencies(processCallbacks)).toBe(
        true,
      );
      expect(mockShellService.run).toHaveBeenCalledWith(
        "ldconfig -p | grep libgomp",
      );
    });

    it("returns false when libgomp is not found", async () => {
      mockShellService.run.mockResolvedValue("");
      expect(await installer.ensureUnixDependencies(processCallbacks)).toBe(
        false,
      );
      expect(mockShellService.run).toHaveBeenCalledWith(
        "ldconfig -p | grep libgomp",
      );
    });

    it("it calls warn in processCallbacks when libgomp is not found", async () => {
      mockShellService.run.mockResolvedValue("");
      await installer.ensureUnixDependencies(processCallbacks);
      expect(processCallbacks.warn).toHaveBeenCalledWith("libgomp not found.");
    });
  });

  describe("saveCodexInstallPath", () => {
    const codexExe = "_codex_.exe";
    const pathJointResult = "/path-to-codex/_codex_.exe";

    beforeEach(() => {
      mockFsService.pathJoin.mockReturnValue(pathJointResult);
    });

    it("combines the install path with the exe", async () => {
      mockFsService.isFile.mockReturnValue(true);
      await installer.saveCodexInstallPath(codexExe);
      expect(mockFsService.pathJoin).toHaveBeenCalledWith([
        config.codexInstallPath,
        codexExe,
      ]);
    });

    it("sets the codex exe path", async () => {
      mockFsService.isFile.mockReturnValue(true);
      await installer.saveCodexInstallPath(codexExe);
      expect(config.codexExe).toBe(pathJointResult);
    });

    it("throws when file does not exist", async () => {
      mockFsService.isFile.mockReturnValue(false);
      await expect(installer.saveCodexInstallPath(codexExe)).rejects.toThrow(
        "Codex executable not found.",
      );
    });

    it("saves the config", async () => {
      mockFsService.isFile.mockReturnValue(true);
      await installer.saveCodexInstallPath(codexExe);
      expect(mockConfigService.saveConfig).toHaveBeenCalled();
    });
  });

  describe("uninstallCodex", () => {
    it("deletes the codex install path", () => {
      installer.uninstallCodex();

      expect(mockFsService.deleteDir).toHaveBeenCalledWith(
        config.codexInstallPath,
      );
    });

    it("deletes the codex data path", () => {
      installer.uninstallCodex();

      expect(mockFsService.deleteDir).toHaveBeenCalledWith(config.dataDir);
    });
  });
});
