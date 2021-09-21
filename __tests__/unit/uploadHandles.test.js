import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";
import { resolve } from "path";
import { pipeline } from "stream/promises";
import fs from "fs";
import { logger } from "../../src/logger.js";

describe("#Upload handler suite", () => {
  
  const ioObject = {
    to: id => ioObject,
    emit: (event, message) => {}
  };

  beforeEach( () => {
    jest.spyOn(logger, "info").mockImplementation();
  });


  describe("#Register events", () => {
    test("should call onFile and onFinish busboy callback", async () => {
      const uploadHandler = new UploadHandler({ io: ioObject, socketId: "01"});

      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue();

      const headers = {
        "content-type": "multipart/form-data; boundary=",
      };
      const onFinish = jest.fn();
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish);

      const fileStream = TestUtil.generateReadableStream(["chunk", "of" , "data"]);

      busboyInstance.emit("file", "fieldname", fileStream, "filename.txt" );

      busboyInstance.listeners("finish")[0].call();


      expect(uploadHandler.onFile).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();

    });
  });

  describe("#registerEvents", () => {

  });
  
  describe("#onFile", () => {
    test("given a stream file it should save on disk", async () => {
      const downloadsFolder = "/tmp";
      const chunks = ["Hello", "My", "friend"];
      const handler = new UploadHandler({
        io: ioObject,
        socketId:"01",
        downloadsFolder
      });

      const onData = jest.fn();
      jest.spyOn(fs, fs.createWriteStream.name)
        .mockImplementation( () => TestUtil.generateWritableStream(onData));

      const onTransform = jest.fn();
      jest.spyOn(handler, handler.handleFileBytes.name)
        .mockImplementation( () => TestUtil.generateTransformStream(onTransform));


      const params = {
        fieldname: "video",
        file: TestUtil.generateReadableStream(chunks),
        filename: "mockFile.txt"
      };

      await handler.onFile(...Object.values(params));

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectedFileName = resolve(handler.downloadsFolder, params.filename);

      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFileName);
    });
  });

  describe("#handleFileBytes", () => {
    test("Should call emit function and it is a tranform stream", async () => {
      jest.spyOn(ioObject, ioObject.to.name);
      jest.spyOn(ioObject, ioObject.emit.name);

      
      const handler = new UploadHandler({
        socketId:"01",
        io: ioObject
      });

      jest.spyOn(handler, handler.canExecute.name).mockReturnValue(true);
      
      const messages = ["message"];
      const source = TestUtil.generateReadableStream(messages);
      const onWrite = jest.fn();
      const target = TestUtil.generateWritableStream(onWrite);

      await pipeline (
        source,
        handler.handleFileBytes("filename.txt"),
        target
      );

      expect(ioObject.to).toHaveBeenCalledTimes(messages.length);
      expect(ioObject.emit).toHaveBeenCalledTimes(messages.length);
      
      
      expect(onWrite).toHaveBeenCalledTimes(messages.length);
      expect(onWrite.mock.calls.join()).toEqual(messages.join());
    });

    test("Given test timer delay at 2 seconds, it should emit only on message during 3 seconds!", async () => {
      jest.spyOn(ioObject, ioObject.emit.name);

      const day = "2021-07-01 01:01";
      
      // Date.now do this.lastMessageSent em handleBytes
      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`);

      // -> hello chegou
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`);
      const onSecondUpdateLastMessageSent = onFirstCanExecute;

      // -> segundo hello, está fora da janela de tempo!
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`);

      // -> world
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`);

      
      TestUtil.mockDateNow(
        [
          onFirstLastMessageSent,
          onFirstCanExecute,
          onSecondUpdateLastMessageSent,
          onSecondCanExecute,
          onThirdCanExecute,
        ]
      );


      const messages = ["Hello", "my", "friend"];
      const filename = "filename.mp3";

      const source = TestUtil.generateReadableStream(messages);

      const messageTimeDelay = 2000;
      const handler = new UploadHandler({
        socketId:"01",
        io: ioObject,
        messageTimeDelay
      }); 

      await pipeline(
        source,
        handler.handleFileBytes(filename),

      );

      expect(ioObject.emit).toBeCalledTimes(2);

      const [firstCallResult, secondCallResult] = ioObject.emit.mock.calls;
      expect(firstCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: "hello".length, filename}]);
      expect(secondCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: messages.join("").length, filename}]);
    });
  });

  describe("#canExecute", () => {
    
    test("Should return true when time is later than specified delay", async () => {
      const timerDelay = 1000;
      const uploadHandler = new UploadHandler({
        io:{},
        socketId:"",
        messageTimeDelay: timerDelay
      });
      
      const tickNow = TestUtil.getTimeFromDate("2012-07-01 00:00:03");
      TestUtil.mockDateNow([tickNow]);
      const lastExecution = TestUtil.getTimeFromDate("2012-07-01 00:00:00");


      const result = uploadHandler.canExecute(lastExecution);

      expect(result).toBeTruthy();
      
    });
    test("Should return false when time is earlier than specified delay", async () => {
      const timerDelay = 3000;
      const uploadHandler = new UploadHandler({
        io:{},
        socketId:"",
        messageTimeDelay: timerDelay
      });
      
      const tickNow = TestUtil.getTimeFromDate("2012-07-01 00:00:02");
      TestUtil.mockDateNow([tickNow]);
      const lastExecution = TestUtil.getTimeFromDate("2012-07-01 00:00:00");


      const result = uploadHandler.canExecute(lastExecution);

      expect(result).toBeFalsy();
    });
  });
});