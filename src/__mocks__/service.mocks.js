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
  saveConfig: vi.fn(),
  loadConfig: vi.fn(),
};

export const mockFsService = {
  getAvailableRoots: vi.fn(),
  pathJoin: vi.fn(),
  isDir: vi.fn(),
  isFile: vi.fn(),
  readDir: vi.fn(),
  makeDir: vi.fn(),
  deleteDir: vi.fn(),
};

export const mockShellService = {
  run: vi.fn(),
};

export const mockOsService = {
  isWindows: vi.fn(),
  isDarwin: vi.fn(),
  isLinux: vi.fn(),
  getWorkingDir: vi.fn(),
};
