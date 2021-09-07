import { describe, test, expect, jest } from "@jest/globals";
import fs from "fs";
import FileHelper from "../../src/fileHelper";


describe("#FileHelper", () => {
  
  describe("#getFileStatus", () => {
    test("It should return file status in correct format", async () => {
      const statMock = {
        dev: 2050,
        mode: 33204,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 17961058,
        size: 809119,
        blocks: 1584,
        atimeMs: 1630971775229.0854,
        mtimeMs: 1630971774809.0732,
        ctimeMs: 1630971774813.0735,
        birthtimeMs: 1630971774805.0732,
        atime: "2021-09-06T23:42:55.229Z",
        mtime: "2021-09-06T23:42:54.809Z",
        ctime: "2021-09-06T23:42:54.813Z",
        birthtime: "2021-09-06T23:42:54.805Z"
      };

      const mockUser = "system";
      const fileName = "Nice Photo.png";
      process.env.USER = mockUser;

      jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValue([fileName]);

      jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValue(statMock);
        
      const result = await FileHelper.getFileStatus("/tmp");


      const expectedFileResult = [
        {
          size: "809 kB",
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: fileName
        }
      ];


      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${fileName}`);
      expect(result).toMatchObject(expectedFileResult);

    });
  });
});
