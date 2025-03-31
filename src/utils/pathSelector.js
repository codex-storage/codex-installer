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
    var uiOptions = [];
    options.foreach(function (option) {
      uiOptions.push({
        label: option,
        action: () => {
          selected = option;
        },
      })
    })

    await this.ui.askMultipleChoice("Select an subdir", uiOptions);

    if (selected.length < 1) return;
    this.updateCurrentIfValidParts([...this.currentPath, selected]);
  };

  createSubDir = async () => {
    const name = await this.ui.askPrompt("Enter name:");
    if (name.length < 1) return;
    this.updateCurrentIfValidParts([...currentPath, name]);
  };
}
