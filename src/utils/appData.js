import path from "path";
import fs from "fs";

export function getAppDataDir() {
  return ensureExists(appData("codex-cli"));
}

export function getCodexRootPath() {
  return ensureExists(appData("codex"));
}

export function getCodexBinPath() {
  return ensureExists(path.join(appData("codex"), "bin"));
}

export function getCodexConfigFilePath() {
  return path.join(appData("codex"), "bin", "config.toml");
}

export function getCodexDataDirDefaultPath() {
  // This path does not exist on first startup. That's good: Codex will
  // create it with the required access permissions.
  return path.join(appData("codex"), "datadir");
}

export function getCodexLogsDefaultPath() {
  return ensureExists(path.join(appData("codex"), "logs"));
}

function ensureExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function appData(...app) {
  let appData;
  if (process.platform === "win32") {
    appData = path.join(process.env.APPDATA, ...app);
  } else if (process.platform === "darwin") {
    appData = path.join(
      process.env.HOME,
      "Library",
      "Application Support",
      ...app,
    );
  } else {
    appData = path.join(process.env.HOME, ...prependDot(...app));
  }
  return appData;
}

function prependDot(...app) {
  return app.map((item, i) => {
    if (i === 0) {
      return `.${item}`;
    } else {
      return item;
    }
  });
}
