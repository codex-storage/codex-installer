import boxen from "boxen";
import chalk from "chalk";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";

import { ASCII_ART } from "../constants/ascii.js";

function show(msg) {
  console.log(msg);
}

export class UiService {
  showSuccessMessage = (message) => {
    show(
      boxen(chalk.green(message), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
        title: "✅ SUCCESS",
        titleAlignment: "center",
      }),
    );
  };

  showErrorMessage = (message) => {
    show(
      boxen(chalk.red(message), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red",
        title: "❌ ERROR",
        titleAlignment: "center",
      }),
    );
  };

  showInfoMessage = (message) => {
    show(
      boxen(chalk.cyan(message), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        title: "ℹ️  INFO",
        titleAlignment: "center",
      }),
    );
  };

  showLogo = () => {
    console.log("\n" + chalk.cyanBright(ASCII_ART));
  };

  askMultipleChoice = async (message, choices) => {
    var counter = 1;
    var promptChoices = [];
    choices.forEach(function (choice) {
      promptChoices.push(`${counter}. ${choice.label}`);
      counter++;
    });

    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message: message,
        choices: promptChoices,
        pageSize: counter - 1,
        loop: true,
      },
    ]);

    const selectStr = choice.split(".")[0];
    const selectIndex = parseInt(selectStr) - 1;

    await choices[selectIndex].action();
  };

  askPrompt = async (prompt) => {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "valueStr",
        message: prompt,
      },
    ]);
    return response.valueStr;
  };

  createAndStartSpinner = (message) => {
    return createSpinner(message).start();
  };

  stopSpinnerSuccess = (spinner) => {
    if (spinner == undefined) return;
    spinner.stop();
  };

  stopSpinnerError = (spinner) => {
    if (spinner == undefined) return;
    spinner.error();
  };
}
