import { describe, test, expect, jest, beforeEach, beforeAll, afterAll } from "@jest/globals";
import TestUtil from "../_util/testUtil.js";
import { tmpdir } from "os";
import { join } from "path";
import fs from "fs";

import FormData from "form-data";
import Routes from "../../src/routes.js";
import { logger } from "../../src/logger.js";

describe("#Routes integration test", () =>{
  
  let defaultDownloadsFolder = "";
  
  beforeAll( async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), "downloads-"));
  });
  
  afterAll( async () => {
    await fs.promises.rm(defaultDownloadsFolder, {recursive:true});
  });

  beforeEach( () => {
    jest.spyOn(logger, "info").mockImplementation();
  });
  
  describe("#getFileStatus", () => {
    const ioObject = {
      to: id => ioObject,
      emit: (event, message) => {}
    };



    test("Should upload file to the folder", async () => {
      const filename = "test.txt";
      const fileStream = fs.createReadStream(`./__tests__/integration/mocks/${filename}`);
      const response = TestUtil.generateWritableStream( () => {});

      const form = new FormData();
      form.append("file", fileStream );

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: "POST",
          url: "?socketId=10"
        }),

        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn()
        }),
        values: () => Object.values(defaultParams)
      }; 
      
      const routes = new Routes(defaultDownloadsFolder);
      routes.setSocketInstance(ioObject);
      const dirBeforeRan = await fs.promises.readdir(defaultDownloadsFolder);
      
      expect(dirBeforeRan).toEqual([]);

      await routes.handler(...defaultParams.values());
      const dirAfterRan = await fs.promises.readdir(defaultDownloadsFolder);
      
      expect(dirAfterRan).toEqual([filename]);
      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200);

      const expectedResult = JSON.stringify({result: "Files uploaded with success! "});
      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult);
    });
  });
});