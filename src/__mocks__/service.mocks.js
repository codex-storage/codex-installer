import { vi } from "vitest";

export const mockUiService = {
  showLogo: vi.fn(),
  showInfoMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  askMultipleChoice: vi.fn(),
  askPrompt: vi.fn()
};

export const mockConfigService = {
  get: vi.fn(),
  saveConfig: vi.fn(),
  loadConfig: vi.fn(),
};
