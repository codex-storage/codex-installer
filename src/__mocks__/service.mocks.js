import { vi } from "vitest";

export const mockUiService = {
  showLogo: vi.fn(),
  showInfoMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  askMultipleChoice: vi.fn(),
  askPrompt: vi.fn(),
  createAndStartSpinner: vi.fn(),
  stopSpinnerSuccess: vi.fn(),
  stopSpinnerError: vi.fn(),
};

export const mockConfigService = {
  get: vi.fn(),
  getCodexExe: vi.fn(),
  getCodexConfigFilePath: vi.fn(),
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  writeCodexConfigFile: vi.fn(),
};

export const mockFsService = {
  getAvailableRoots: vi.fn(),
  pathJoin: vi.fn(),
  isDir: vi.fn(),
  isFile: vi.fn(),
  readDir: vi.fn(),
  makeDir: vi.fn(),
  moveDir: vi.fn(),
  deleteDir: vi.fn(),
  readJsonFile: vi.fn(),
  writeJsonFile: vi.fn(),
  writeFile: vi.fn(),
  ensureDirExists: vi.fn(),
};

export const mockShellService = {
  run: vi.fn(),
  spawnDetachedProcess: vi.fn(),
};

export const mockOsService = {
  isWindows: vi.fn(),
  isDarwin: vi.fn(),
  isLinux: vi.fn(),
  getWorkingDir: vi.fn(),
  listProcesses: vi.fn(),
  stopProcess: vi.fn(),
  terminateProcess: vi.fn(),
};

export const mockCodexGlobals = {
  getPublicIp: vi.fn(),
  getTestnetSPRs: vi.fn(),
};

export const mockCodexApp = {
  openCodexApp: vi.fn(),
};
