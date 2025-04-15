import { vi } from "vitest";

export const mockInstaller = {
  isCodexInstalled: vi.fn(),
  getCodexVersion: vi.fn(),
  installCodex: vi.fn(),
  uninstallCodex: vi.fn(),
};

export const mockProcessControl = {
  getNumberOfCodexProcesses: vi.fn(),
  stopCodexProcess: vi.fn(),
  startCodexProcess: vi.fn(),
};
