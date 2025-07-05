import { vi } from "vitest";

export const mockPathSelector = {
  show: vi.fn(),
};

export const mockNumberSelector = {
  show: vi.fn(),
};

export const mockMenuLoop = {
  initialize: vi.fn(),
  showOnce: vi.fn(),
  showLoop: vi.fn(),
  stopLoop: vi.fn(),
};

export const mockDataDirMover = {
  moveDataDir: vi.fn(),
};
