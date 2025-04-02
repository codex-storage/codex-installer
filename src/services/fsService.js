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
        mountPoints.push(volume.mountPoint);
      });
    });

    if (mountPoints.length < 1) {
      throw new Error("Failed to detect file system devices.");
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

  readDir = (dir) => {
    return fs.readdirSync(dir);
  };

  makeDir = (dir) => {
    fs.mkdirSync(dir);
  };
}
