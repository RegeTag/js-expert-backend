import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { logger } from "../../src/logger.js";
import Routes from "../../src/routes.js";
import UploadHanlder from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";


describe("Routes suite test", () => {
  const request = TestUtil.generateReadableStream(["file"]);
  const response = TestUtil.generateWritableStream( () => {});
  
  const defaultParams = {
    req: Object.assign(request, {
      headers:{
        "Content-Type":"multipart/form-data"
      },
      method:"",
      body:{}
    }),
    res:Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn()
    }),
    values: () => Object.values(defaultParams)
  }; 

  beforeEach( () => {
    jest.spyOn(logger, "info").mockImplementation();
  });


  describe("#setSocketInstance", () => {
    test("setSocket should store a io instance", () => {
      const routes = new Routes();
      
      const ioObject = {
        to: id => ioObject,
        emit: (event, message) => {}
      };

      routes.setSocketInstance(ioObject);
      expect(routes.io).toStrictEqual(ioObject);
    });

  });

  describe("#handler", () => {
    

    test("Given a inexistent route it should return the default route", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams
      };

      params.req.method = "undefined";
      
      await routes.handler(...params.values());

      expect(params.res.end).toHaveBeenCalledWith("Hello World");
    });

    test("Should set CORS enabled on any request", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams
      };

      params.req.method = "undefined";
      
      await routes.handler(...params.values());

      expect(params.res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    });


    test("Given method OPTIONS it should return options route", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams
      };

      params.req.method = "OPTIONS";
      
      await routes.handler(...params.values());

      expect(params.res.writeHead).toHaveBeenCalledWith(204);
      expect(params.res.end).toHaveBeenCalled();
    });


    test("Given method POST it should return post route", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams
      };

      params.req.method = "POST";

      jest.spyOn(routes, routes.post.name).mockResolvedValue();
      
      await routes.handler(...params.values());
      expect(routes.post).toHaveBeenCalled();
    });


    test("Given method GET it should return get route", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams
      };

      params.req.method = "GET";
      
      jest.spyOn(routes, routes.get.name).mockResolvedValue();

      await routes.handler(...params.values());
      expect(routes.get).toHaveBeenCalled();
    });

  });

  describe("#GET", () => {
    test("given method get it should list all uploaded files", async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams
      };

      const fileStatusMock = [
        {
          size: "809 kB",
          lastModified: "2021-09-06T23:42:54.805Z",
          owner: process.env.USER,
          file: "whatever.mp3"
        }
      ];

      jest.spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name).mockResolvedValue(fileStatusMock);

      params.req.method = "GET";

      await routes.handler(...params.values());

      expect(params.res.writeHead).toHaveBeenCalledWith(200);
      expect(params.res.end).toHaveBeenCalledWith(JSON.stringify(fileStatusMock));
    });
  });

  describe("#POST", () => {
    test("it should validate post rout workflow", async () => {
      const routes = new Routes("/tmp");
      const options = {
        ...defaultParams
      };

      options.req.method = "POST";
      options.req.url = "?socketId=10";

      jest.spyOn( UploadHanlder.prototype, UploadHanlder.prototype.registerEvents.name)
        .mockImplementation( (headers, onFinish) => {
          const writable = TestUtil.generateWritableStream( () => {});
          writable.on("finish", onFinish);

          return writable;
        });

      await routes.handler(...options.values());

      expect(UploadHanlder.prototype.registerEvents).toHaveBeenCalled();
      expect(options.res.writeHead).toHaveBeenCalledWith(200);
      
      const expectedResult = JSON.stringify({result: "Files uploaded with success! "});
      expect(defaultParams.res.end).toHaveBeenCalledWith(expectedResult);
    });
  });
});