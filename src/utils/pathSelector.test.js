import { describe, beforeEach, it, expect, vi } from "vitest";
import { PathSelector } from "./pathSelector.js";
import { mockUiService, mockFsService } from "../__mocks__/service.mocks.js";
import { mockMenuLoop } from "../__mocks__/utils.mocks.js";

describe("PathSelector", () => {
  let pathSelector;
  const mockRoots = ["/", "/home"];
  const mockStartPath = "/home/user";

  beforeEach(() => {
    vi.resetAllMocks();
    mockFsService.getAvailableRoots.mockReturnValue(mockRoots);
    mockFsService.pathJoin.mockImplementation((parts) => parts.join("/"));
    mockFsService.isDir.mockReturnValue(true);
    mockFsService.readDir.mockReturnValue(["dir1", "dir2"]);

    pathSelector = new PathSelector(mockUiService, mockMenuLoop, mockFsService);
  });

  describe("initialization", () => {
    it("initializes the menu loop", () => {
      expect(mockMenuLoop.initialize).toHaveBeenCalledWith(pathSelector.showPathSelector);
    });
  });

  describe("show()", () => {
    it("initializes path selection with given path", async () => {
      await pathSelector.show(mockStartPath, true);
      expect(mockFsService.getAvailableRoots).toHaveBeenCalled();
      expect(pathSelector.currentPath).toEqual(["home", "user"]);
    });

    it("uses first root if starting path is invalid", async () => {
      await pathSelector.show("invalid/path", true);
      expect(pathSelector.currentPath).toEqual([mockRoots[0]]);
    });

    it("starts the menu loop", async () => {
      await pathSelector.show(mockStartPath, true);
      expect(mockMenuLoop.showLoop).toHaveBeenCalled();
    });

    it("returns the resulting path after selection", async () => {
      pathSelector.resultingPath = mockStartPath;
      const result = await pathSelector.show(mockStartPath, true);
      expect(result).toBe(mockStartPath);
    });
  });

//   describe("path operations", () => {
//     beforeEach(async () => {
//       await pathSelector.show(mockStartPath, true);
//     });

//     it("splits paths correctly", () => {
//       const result = pathSelector.splitPath("C:\\path\\to\\dir");
//       expect(result).toEqual(["C:", "path", "to", "dir"]);
//     });

//     it("drops empty path parts", () => {
//       const result = pathSelector.dropEmptyParts(["", "path", "", "dir", ""]);
//       expect(result).toEqual(["path", "dir"]);
//     });

//     it("combines path parts correctly", () => {
//       const result = pathSelector.combine(["home", "user", "docs"]);
//       expect(result).toBe("home/user/docs");
//     });

//     it("handles single part paths in combine", () => {
//       const result = pathSelector.combine(["root"]);
//       expect(result).toBe("root");
//     });
//   });

//   describe("navigation", () => {
//     beforeEach(async () => {
//       await pathSelector.show(mockStartPath, true);
//     });

//     it("moves up one directory", () => {
//       pathSelector.upOne();
//       expect(pathSelector.currentPath).toEqual(["home"]);
//     });

//     it("handles down directory navigation", async () => {
//       mockFsService.readDir.mockReturnValue(["subdir1", "subdir2"]);
//       mockFsService.isDir.mockReturnValue(true);
      
//       await pathSelector.downOne();
      
//       expect(mockUiService.askMultipleChoice).toHaveBeenCalled();
//       expect(mockFsService.readDir).toHaveBeenCalled();
//     });

//     it("creates new subdirectory", async () => {
//       mockUiService.askPrompt.mockResolvedValue("newdir");
//       await pathSelector.createSubDir();
      
//       expect(mockFsService.makeDir).toHaveBeenCalled();
//       expect(pathSelector.currentPath).toEqual(["home", "user", "newdir"]);
//     });
//   });

//   describe("path validation", () => {
//     it("validates root paths", () => {
//       expect(pathSelector.hasValidRoot(["/home"])).toBe(true);
//       expect(pathSelector.hasValidRoot([])).toBe(false);
//       expect(pathSelector.hasValidRoot(["invalid"])).toBe(false);
//     });

//     it("validates full paths", () => {
//       mockFsService.isDir.mockReturnValue(false);
//       pathSelector.updateCurrentIfValidFull("/invalid/path");
//       expect(mockUiService.showErrorMessage).toHaveBeenCalled();
//     });
//   });

//   describe("selection and cancellation", () => {
//     beforeEach(async () => {
//       await pathSelector.show(mockStartPath, true);
//     });

//     it("selects current path", async () => {
//       await pathSelector.selectThisPath();
//       expect(pathSelector.resultingPath).toBe("home/user");
//       expect(mockMenuLoop.stopLoop).toHaveBeenCalled();
//     });

//     it("cancels and returns to starting path", async () => {
//       await pathSelector.cancel();
//       expect(pathSelector.resultingPath).toBe(mockStartPath);
//       expect(mockMenuLoop.stopLoop).toHaveBeenCalled();
//     });
//   });
});
