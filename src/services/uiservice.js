import boxen from "boxen";
import chalk from "chalk";

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

  showInfoMessage(message) {
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
  }
}
