import path from 'path';
import inquirer from 'inquirer';
import boxen from 'boxen';
import chalk from 'chalk';
import fs from 'fs';

function showMsg(msg) {
  console.log(boxen(chalk.white(msg), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'white',
    titleAlignment: 'center'
  }));
}

function splitPath(str) {
  return str.replaceAll("\\", "/").split("/");
}

function showCurrent(currentPath) {
  const len = currentPath.length;
  showMsg(`Current path: [${len}]\n` + path.join(...currentPath));
}

async function showMain(currentPath) {
  showCurrent(currentPath);
  const { choice } = await inquirer.prompt([
    {
        type: 'list',
        name: 'choice',
        message: 'Select an option:',
        choices: [
            '1. Enter path',
            '2. Go up one',
            '3. Go down one',
            '4. Check path exists',
            '5. Create new folder here',
            '6. Select this path',
            '7. Cancel'
        ],
        pageSize: 6,
        loop: true
    }
  ]).catch(() => {
    handleExit();
    return { choice: '6' };
  });

  return choice;
}

export async function selectPath() {
  var currentPath = splitPath(process.cwd());

  while (true) {
    const choice = await showMain(currentPath);

    switch (choice.split('.')[0]) {
      case '1':
          currentPath = await enterPath();
          break;
      case '2':
          currentPath = upOne(currentPath);
          break;
      case '3':
          currentPath = await downOne(currentPath);
          break;
      case '4':
          await checkExists(currentPath);
          break;
      case '5':
          currentPath = await createSubDir(currentPath);
          break;
      case '6':
        if (!isDir(currentPath)) {
          console.log("Current path does not exist.");
        } else {
          return currentPath;
        }
      case '7':
          return "";
    }
  }
}

async function enterPath() {
  const response = await inquirer.prompt([
    {
        type: 'input',
        name: 'path',
        message: 'Enter Path:'
    }]);

  return splitPath(response.path);
}

function upOne(currentPath) {
  return currentPath.slice(0, currentPath.length - 1);
}

function isDir(dir) {
  return fs.lstatSync(dir).isDirectory();
}

function isSubDir(currentPath, entry) {
  const newPath = path.join(...currentPath, entry);
  return isDir(newPath);
}

function getSubDirOptions(currentPath) {
  const entries = fs.readdirSync(path.join(...currentPath));
  var result = [];
  var counter = 1;
  entries.forEach(function(entry) {
    if (isSubDir(currentPath, entry)) {
      result.push(counter + ". " + entry);
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

  const { choice } = await inquirer.prompt([
    {
        type: 'list',
        name: 'choice',
        message: 'Select an subdir:',
        choices: options,
        pageSize: options.length,
        loop: true
    }
  ]).catch(() => {
    return currentPath;
  });

  const subDir = choice.slice(3);
  return [...currentPath, subDir];
}

async function checkExists(currentPath) {
  if (!isDir(path.join(...currentPath))) {
    console.log("Current path does not exist.");
  } else{
    console.log("Current path exists.");
  }
}

async function createSubDir(currentPath) {
  const response = await inquirer.prompt([
    {
        type: 'input',
        name: 'name',
        message: 'Enter name:'
    }]);

  const name = response.name;
  if (name.length < 1) return;

  const fullDir = path.join(...currentPath, name);
  fs.mkdirSync(fullDir);
  return [...currentPath, name];
}
