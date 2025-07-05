import { describe, beforeEach, it, expect, vi } from "vitest";
import { NumberSelector } from "./numberSelector.js";

describe("number selector", () => {
  let numberSelector;
  const mockUiService = {
    askPrompt: vi.fn(),
  };

  const prompt = "abc??";

  beforeEach(() => {
    vi.resetAllMocks();

    numberSelector = new NumberSelector(mockUiService);
  });

  it("shows the prompt", async () => {
    await numberSelector.show(0, prompt, false);

    expect(mockUiService.askPrompt).toHaveBeenCalledWith(prompt);
  });

  it("returns a number given valid input", async () => {
    mockUiService.askPrompt.mockResolvedValue("123");

    const number = await numberSelector.show(0, prompt, false);

    expect(number).toEqual(123);
  });

  it("returns the current number given invalid input", async () => {
    const currentValue = 321;

    mockUiService.askPrompt.mockResolvedValue("what?!");

    const number = await numberSelector.show(currentValue, prompt, false);

    expect(number).toEqual(currentValue);
  });

  async function run(input) {
    mockUiService.askPrompt.mockResolvedValue(input);
    return await numberSelector.show(0, prompt, true);
  }

  it("allows for metric postfixes (k)", async () => {
    expect(await run("1k")).toEqual(1024);
  });

  it("allows for metric postfixes (m)", async () => {
    expect(await run("1m")).toEqual(1024 * 1024);
  });

  it("allows for metric postfixes (g)", async () => {
    expect(await run("1g")).toEqual(1024 * 1024 * 1024);
  });

  it("allows for metric postfixes (t)", async () => {
    expect(await run("1t")).toEqual(1024 * 1024 * 1024 * 1024);
  });
});
