export class PathSelector {
  constructor(uiService, menuLoop, fsService) {
    this.ui = uiService;
    this.loop = menuLoop;
    this.fs = fsService;

    this.pathMustExist = true;
    this.loop.initialize(this.showPathSelector);
  }

  show = async (startingPath, pathMustExist) => {
    this.startingPath = startingPath;
    this.pathMustExist = pathMustExist;
    this.roots = this.fs.getAvailableRoots();
    this.currentPath = this.splitPath(startingPath);
    if (!this.hasValidRoot(this.currentPath)) {
      this.currentPath = [this.roots[0]];
    }

    await this.loop.showLoop();

    return this.resultingPath;
  };

  showPathSelector = async () => {
    this.showCurrent();
    await this.ui.askMultipleChoice("Select an option:", [
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
  };

  splitPath = (str) => {
    var result = this.dropEmptyParts(str.replaceAll("\\", "/").split("/"));
    if (str.startsWith("/") && this.roots.includes("/")) {
      result = ["/", ...result]; 
    }
    return result;
  };

  dropEmptyParts = (parts) => {
    return parts.filter(part => part.length > 0);
  };

  combine = (parts) => {
    const toJoin = this.dropEmptyParts(parts);
    if (toJoin.length == 1) return toJoin[0];
    var result = this.fs.pathJoin(toJoin);
    if (result.startsWith("//")) {
      result = result.substring(1);
    }
    return result;
  };

  combineWith = (parts, extra) => {
    const toJoin = this.dropEmptyParts(parts);
    if (toJoin.length == 1) return this.fs.pathJoin([toJoin[0], extra]);
    return this.fs.pathJoin([...toJoin, extra]);
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
      this.ui.showErrorMessage("The path does not exist.");
      return;
    }
    this.updateCurrentIfValidParts(this.splitPath(newFullPath));
  };

  updateCurrentIfValidParts = (newParts) => {
    if (!this.hasValidRoot(newParts)) {
      this.ui.showErrorMessage("The path has no valid root.");
      return;
    }
    this.currentPath = newParts;
  };

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
    return entries.filter(entry => this.isSubDir(entry));
  };

  downOne = async () => {
    const options = this.getSubDirOptions();
    if (options.length == 0) {
      this.ui.showInfoMessage("There are no subdirectories here.");
      return;
    }

    var selected = "";
    var uiOptions = [];
    options.forEach(function (option) {
      uiOptions.push({
        label: option,
        action: () => {
          selected = option;
        },
      });
    });

    await this.ui.askMultipleChoice("Select an subdir", uiOptions);

    if (selected.length < 1) return;
    this.updateCurrentIfValidParts([...this.currentPath, selected]);
  };

  createSubDir = async () => {
    const name = await this.ui.askPrompt("Enter name:");
    if (name.length < 1) return;
    const newPath = [...this.currentPath, name];
    if (this.pathMustExist) {
      this.fs.makeDir(this.combine(newPath));
    }
    this.updateCurrentIfValidParts(newPath);
  };

  selectThisPath = async () => {
    this.resultingPath = this.combine(this.currentPath);
    this.loop.stopLoop();
  };

  cancel = async () => {
    this.resultingPath = this.startingPath;
    this.loop.stopLoop();
  };
}
