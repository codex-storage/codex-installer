export class NumberSelector {
  constructor(uiService) {
    this.uiService = uiService;
  }

  show = async (currentValue, promptMessage, allowMetricPostfixes) => {
    try {
      var valueStr = await this.promptForValueStr(promptMessage);
      valueStr = valueStr.replaceAll(" ", "");
      const mult = this.getMetricsMult(valueStr, allowMetricPostfixes);
      const value = this.getNumericValue(valueStr);
      return value * mult;
    } catch {
      return currentValue;
    }
  };

  getMetricsMult = (valueStr, allowMetricPostfixes) => {
    if (!allowMetricPostfixes) return 1;
    const lower = valueStr.toLowerCase();
    if (lower.endsWith("tb") || lower.endsWith("t")) return Math.pow(1024, 4);
    if (lower.endsWith("gb") || lower.endsWith("g")) return Math.pow(1024, 3);
    if (lower.endsWith("mb") || lower.endsWith("m")) return Math.pow(1024, 2);
    if (lower.endsWith("kb") || lower.endsWith("k")) return Math.pow(1024, 1);
    return 1;
  };

  getNumericValue = (valueStr) => {
    try {
      const num = valueStr.match(/\d+/g);
      const result = parseInt(num);
      if (isNaN(result) || !isFinite(result)) {
        throw new Error("Invalid input received.");
      }
      return result;
    } catch (error) {
      console.log("Failed to parse input: " + error.message);
      throw error;
    }
  };

  promptForValueStr = async (promptMessage) => {
    return this.uiService.askPrompt(promptMessage);
  };
}
