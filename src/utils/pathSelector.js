import path from "path";
import inquirer from "inquirer";
import boxen from "boxen";
import chalk from "chalk";
import fs from "fs";
import { filesystemSync } from "fs-filesystem";

function showMsg(msg) {
  console.log(
    boxen(chalk.white(msg), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "white",
      titleAlignment: "center",
    }),
  );
}

function getAvailableRoots() {
  const devices = filesystemSync();
  var mountPoints = [];
  Object.keys(devices).forEach(function (key) {
    var val = devices[key];
    val.volumes.forEach(function (volume) {
      mountPoints.push(volume.mountPoint);
    });
  });

  if (mountPoints.length < 1) {
    throw new Error("Failed to detect file system devices.");
  }
  return mountPoints;
}

function splitPath(str) {
  return str.replaceAll("\\", "/").split("/");
}

function dropEmptyParts(parts) {
  var result = [];
  parts.forEach(function (part) {
    if (part.length > 0) {
      result.push(part);
    }
  });
  return result;
}

function combine(parts) {
  const toJoin = dropEmptyParts(parts);
  if (toJoin.length == 1) return toJoin[0];
  return path.join(...toJoin);
}

function combineWith(parts, extra) {
  const toJoin = dropEmptyParts(parts);
  if (toJoin.length == 1) return path.join(toJoin[0], extra);
  return path.join(...toJoin, extra);
}

function showCurrent(currentPath) {
  const len = currentPath.length;
  showMsg(`Current path: [${len}]\n` + combine(currentPath));

  if (len < 2) {
    showMsg(
      "Warning - Known issue:\n" +
        "Path selection does not work in root paths on some platforms.\n" +
        'Use "Enter path" or "Create new folder" to navigate and create folders\n' +
        "if this is the case for you.",
    );
  }
}

function hasValidRoot(roots, checkPath) {
  if (checkPath.length < 1) return false;
  var result = false;
  roots.forEach(function (root) {
    if (root.toLowerCase() == checkPath[0].toLowerCase()) {
      console.log("valid root: " + combine(checkPath));
      result = true;
    }
  });
  if (!result) console.log("invalid root: " + combine(checkPath));
  return result;
}

async function showMain(currentPath) {
  showCurrent(currentPath);
  const { choice } = await inquirer
    .prompt([
      {
        type: "list",
        name: "choice",
        message: "Select an option:",
        choices: [
          "1. Enter path",
          "2. Go up one",
          "3. Go down one",
          "4. Create new folder here",
          "5. Select this path",
          "6. Cancel",
        ],
        pageSize: 6,
        loop: true,
      },
    ])
    .catch(() => {
      handleExit();
      return { choice: "6" };
    });

  return choice;
}

export async function showPathSelector(startingPath, pathMustExist) {
  const roots = getAvailableRoots();
  var currentPath = splitPath(startingPath);
  if (!hasValidRoot(roots, currentPath)) {
    currentPath = [roots[0]];
  }

  while (true) {
    const choice = await showMain(currentPath);

    var newCurrentPath = currentPath;
    switch (choice.split(".")[0]) {
      case "1":
        newCurrentPath = await enterPath(currentPath, pathMustExist);
        break;
      case "2":
        newCurrentPath = upOne(currentPath);
        break;
      case "3":
        newCurrentPath = await downOne(currentPath);
        break;
      case "4":
        newCurrentPath = await createSubDir(currentPath, pathMustExist);
        break;
      case "5":
        if (pathMustExist && !isDir(combine(currentPath))) {
          console.log("Current path does not exist.");
          break;
        } else {
          return combine(currentPath);
        }
      case "6":
        return combine(currentPath);
    }

    if (hasValidRoot(roots, newCurrentPath)) {
      currentPath = newCurrentPath;
    } else {
      console.log("Selected path has no valid root.");
    }
  }
}

async function enterPath(currentPath, pathMustExist) {
  const response = await inquirer.prompt([
    {
      type: "input",
      name: "path",
      message: "Enter Path:",
    },
  ]);

  const newPath = response.path;
  if (pathMustExist && !isDir(newPath)) {
    console.log("The entered path does not exist.");
    return currentPath;
  }
  return splitPath(response.path);
}

function upOne(currentPath) {
  return currentPath.slice(0, currentPath.length - 1);
}

export function isDir(dir) {
  try {
    return fs.lstatSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function isSubDir(currentPath, entry) {
  const newPath = combineWith(currentPath, entry);
  return isDir(newPath);
}

function getSubDirOptions(currentPath) {
  const fullPath = combine(currentPath);
  const entries = fs.readdirSync(fullPath);
  var result = [];
  var counter = 1;
  entries.forEach(function (entry) {
    if (isSubDir(currentPath, entry)) {
      result.push(counter + ". " + entry);
      counter = counter + 1;
    }
  });
  return result;
}

async function downOne(currentPath) {
  const options = getSubDirOptions(currentPath);
  if (options.length == 0) {
    console.log("There are no subdirectories here.");
    return currentPath;
  }

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
}

async function createSubDir(currentPath, pathMustExist) {
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
    fs.mkdirSync(fullDir);
  }
  return [...currentPath, name];
}
