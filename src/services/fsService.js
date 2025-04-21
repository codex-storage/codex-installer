import path from "path";
import fs from "fs";
import { filesystemSync } from "fs-filesystem";

export class FsService {
  getAvailableRoots = () => {
    const devices = filesystemSync();
    var mountPoints = [];
    Object.keys(devices).forEach(function (key) {
      var val = devices[key];
      val.volumes.forEach(function (volume) {
        const mount = volume.mountPoint;
        if (mount != null && mount != undefined && mount.length > 0) {
          try {
            if (!fs.lstatSync(mount).isFile()) {
              mountPoints.push(mount);
            }
          } catch {}
        }
      });
    });

    if (mountPoints.length < 1) {
      // In certain containerized environments, the devices don't reveal any
      // useful mounts. We'll proceed under the assumption that '/' is valid here.
      return ["/"];
    }
    return mountPoints;
  };

  pathJoin = (parts) => {
    return path.join(...parts);
  };

  isDir = (dir) => {
    try {
      return fs.lstatSync(dir).isDirectory();
    } catch {
      return false;
    }
  };

  isFile = (path) => {
    try {
      return fs.lstatSync(path).isFile();
    } catch {
      return false;
    }
  };

  readDir = (dir) => {
    return fs.readdirSync(dir);
  };

  makeDir = (dir) => {
    fs.mkdirSync(dir);
  };

  moveDir = (oldPath, newPath) => {
    fs.moveSync(oldPath, newPath);
  };

  deleteDir = (dir) => {
    fs.rmSync(dir, { recursive: true, force: true });
  };

  readJsonFile = (filePath) => {
    return JSON.parse(fs.readFileSync(filePath));
  };

  writeJsonFile = (filePath, jsonObject) => {
    fs.writeFileSync(filePath, JSON.stringify(jsonObject));
  };

  writeFile = (filePath, content) => {
    fs.writeFileSync(filePath, content);
  };

  ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  };
}
