export class PathSelector {
  constructor(uiService, fsService) {
    this.ui = uiService;
    this.fs = fsService;

    this.pathMustExist = true;
  }

  showPathSelector = async (startingPath, pathMustExist) => {
    this.pathMustExist = pathMustExist;
    this.roots = this.fs.getAvailableRoots();
    this.currentPath = this.splitPath(startingPath);
    if (!this.hasValidRoot(this.currentPath)) {
      this.currentPath = [roots[0]];
    }
    while (true) {
      this.showCurrent();
      this.ui.askMultiChoice("Select an option:", [
        {
          label: "Enter path",
          action: this.enterPath,
        },
        {
          label: "Go up one",
          action: this.upOne,
        },
        {
          label: "Go down one",
          action: this.downOne,
        },
        {
          label: "Create new folder here",
          action: this.createSubDir,
        },
        {
          label: "Select this path",
          action: this.selectThisPath,
        },
        {
          label: "Cancel",
          action: this.cancel,
        },
      ]);
      // var newCurrentPath = currentPath;
      // switch (choice.split(".")[0]) {
      //   case "1":
      //     newCurrentPath = await enterPath(currentPath, pathMustExist);
      //     break;
      //   case "2":
      //     newCurrentPath = upOne(currentPath);
      //     break;
      //   case "3":
      //     newCurrentPath = await downOne(currentPath);
      //     break;
      //   case "4":
      //     newCurrentPath = await createSubDir(currentPath, pathMustExist);
      //     break;
      //   case "5":
      //     if (pathMustExist && !isDir(combine(currentPath))) {
      //       console.log("Current path does not exist.");
      //       break;
      //     } else {
      //       return combine(currentPath);
      //     }
      //   case "6":
      //     return combine(currentPath);
      // }

      // if (hasValidRoot(roots, newCurrentPath)) {
      //   currentPath = newCurrentPath;
      // } else {
      //   console.log("Selected path has no valid root.");
      // }
    }
  };

  splitPath = (str) => {
    return str.replaceAll("\\", "/").split("/");
  };

  dropEmptyParts = (parts) => {
    var result = [];
    parts.forEach(function (part) {
      if (part.length > 0) {
        result.push(part);
      }
    });
    return result;
  };

  combine = (parts) => {
    const toJoin = this.dropEmptyParts(parts);
    if (toJoin.length == 1) return toJoin[0];
    return this.fs.pathJoin(...toJoin);
  };

  combineWith = (parts, extra) => {
    const toJoin = this.dropEmptyParts(parts);
    if (toJoin.length == 1) return this.fs.pathJoin(toJoin[0], extra);
    return this.fs.pathJoin(...toJoin, extra);
  };

  showCurrent = () => {
    const len = this.currentPath.length;
    this.ui.showInfoMessage(
      `Current path: [${len}]\n` + this.combine(this.currentPath),
    );

    if (len < 2) {
      this.ui.showInfoMessage(
        "Warning - Known issue:\n" +
          "Path selection does not work in root paths on some platforms.\n" +
          'Use "Enter path" or "Create new folder" to navigate and create folders\n' +
          "if this is the case for you.",
      );
    }
  };

  hasValidRoot = (checkPath) => {
    if (checkPath.length < 1) return false;
    var result = false;
    this.roots.forEach(function (root) {
      if (root.toLowerCase() == checkPath[0].toLowerCase()) {
        result = true;
      }
    });
    return result;
  };

  updateCurrentIfValidFull = (newFullPath) => {
    if (this.pathMustExist && !this.fs.isDir(newFullPath)) {
      console.log("The path does not exist.");
    }
    this.updateCurrentIfValidParts(this.splitPath(newFullPath));
  }

  updateCurrentIfValidParts = (newParts) => {
    if (!this.hasValidRoot(newParts)) {
      console.log("The path has no valid root.");
    }
    this.currentPath = newParts;
  }

  enterPath = async () => {
    const newPath = await this.ui.askPrompt("Enter Path:");
    this.updateCurrentIfValidFull(newPath);
  };

  upOne = () => {
    const newParts = this.currentPath.slice(0, this.currentPath.length - 1);
    this.updateCurrentIfValidParts(newParts);
  };

  isSubDir = (entry) => {
    const newPath = this.combineWith(this.currentPath, entry);
    return this.fs.isDir(newPath);
  };

  getSubDirOptions = () => {
    const fullPath = this.combine(this.currentPath);
    const entries = this.fs.readDir(fullPath);
    var result = [];
    entries.forEach(function (entry) {
      if (this.isSubDir(entry)) {
        result.push(entry);
      }
    });
    return result;
  };

  downOne = async () => {
    const options = this.getSubDirOptions();
    if (options.length == 0) {
      console.log("There are no subdirectories here.");
    }

    var selected = "";
    const makeSelector = () => {

    };

    const { choice } = await inquirer
      .prompt([
        {
          type: "list",
          name: "choice",
          message: "Select an subdir:",
          choices: options,
          pageSize: options.length,
          loop: true,
        },
      ])
      .catch(() => {
        return currentPath;
      });

    const subDir = choice.split(". ")[1];
    return [...currentPath, subDir];
  };

  createSubDir = async (currentPath, pathMustExist) => {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter name:",
      },
    ]);

    const name = response.name;
    if (name.length < 1) return;

    const fullDir = combineWith(currentPath, name);
    if (pathMustExist && !isDir(fullDir)) {
      // fs.mkdirSync(fullDir);
    }
    return [...currentPath, name];
  };
}
