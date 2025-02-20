import inquirer from 'inquirer';

function getMetricsMult(valueStr, allowMetricPostfixes) {
  if (!allowMetricPostfixes) return 1;
  const lower = valueStr.toLowerCase();
  if (lower.endsWith("tb") || lower.endsWith("t")) return Math.pow(1024, 4);
  if (lower.endsWith("gb") || lower.endsWith("g")) return Math.pow(1024, 3);
  if (lower.endsWith("mb") || lower.endsWith("m")) return Math.pow(1024, 2);
  if (lower.endsWith("kb") || lower.endsWith("k")) return Math.pow(1024, 1);
  return 1;
}

function getNumericValue(valueStr) {
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
}

async function promptForValueStr(promptMessage) {
  const response = await inquirer.prompt([
    {
        type: 'input',
        name: 'valueStr',
        message: promptMessage
    }]);
  return response.valueStr;
}

export async function showNumberSelector(currentValue, promptMessage, allowMetricPostfixes) {
  try {
    var valueStr = await promptForValueStr(promptMessage);
    valueStr = valueStr.replaceAll(" ", "");
    const mult = getMetricsMult(valueStr, allowMetricPostfixes);
    const value = getNumericValue(valueStr);
    return value * mult;
  } catch {
    return currentValue;
  }
}
