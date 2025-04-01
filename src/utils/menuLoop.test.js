import { describe, beforeEach, it, expect, vi } from "vitest";
import { MenuLoop } from "./menuLoop.js";

describe("MenuLoop", () => {
  let menuLoop;
  const mockPrompt = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    menuLoop = new MenuLoop();
    menuLoop.initialize(mockPrompt);
  });

  it("can show menu once", async () => {
    await menuLoop.showOnce();
    expect(mockPrompt).toHaveBeenCalledTimes(1);
  });

  it("can stop the menu loop", async () => {
    mockPrompt.mockImplementation(() => {
      menuLoop.stopLoop();
    });
    await menuLoop.showLoop();

    expect(mockPrompt).toHaveBeenCalledTimes(1);
    expect(menuLoop.running).toBe(false);
  });

  it("can run menu in a loop", async () => {
    let calls = 0;
    mockPrompt.mockImplementation(() => {
      calls++;
      if (calls >= 3) {
        menuLoop.stopLoop();
      }
    });

    await menuLoop.showLoop();

    expect(mockPrompt).toHaveBeenCalledTimes(3);
  });
});
