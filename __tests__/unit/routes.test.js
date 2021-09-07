import { describe, test, expect, jest } from "@jest/globals";
import Routes from "../../src/routes.js";

const defaultParams = {
  req:{
    headers:{
      "Content-Type":"multipart/form-data"
    },
    method:"",
    body:{}
  },
  res:{
    setHeader: jest.fn(),
    writeHead: jest.fn(),
    end: jest.fn()
  },
  values: () => Object.values(defaultParams)
}; 

describe("Routes suite test", () => {
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

});