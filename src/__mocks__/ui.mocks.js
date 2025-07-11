import { vi } from "vitest";

export const mockInstallMenu = {
  show: vi.fn(),
};

export const mockConfigMenu = {
  show: vi.fn(),
};

export const mockDataMenu = {
  performUpload: vi.fn(),
  performDownload: vi.fn(),
  showLocalData: vi.fn(),
};

export const mockNodeStatusMenu = {
  showNodeStatus: vi.fn(),
};
