import fs from "fs";
import Busboy from "busboy";
import { pipeline } from "stream/promises";
import { logger } from "./logger.js";

class UploadHanlder{
  constructor({ io, socketId, downloadsFolder, messageTimeDelay = 500 }){
    this.io = io;
    this.socketId = socketId;
    this.downloadsFolder = downloadsFolder;
    this.ON_UPLOAD_EVENT = "file-upload";
    this.messageTimeDelay = messageTimeDelay;
  }

  canExecute(lastExecution){
    return (Date.now() - lastExecution) >= this.messageTimeDelay;
  }

  handleFileBytes(filename){
    this.lastMessageSend = Date.now();
    
    async function* handleData(source){
      let processedAlready = 0;


      for await(const chunk of source){
        processedAlready += chunk.length;

        yield chunk;

        if(!this.canExecute(this.lastMessageSend)){
          continue;
        }

        this.lastMessageSend = Date.now();

        this.io.to(this.socketId).emit(this.ON_UPLOAD_EVENT, {processedAlready, filename});
        logger.info(`File [${filename}] got ${processedAlready} Bytes to ${this.socketId}`);
      }
    }

    return handleData.bind(this);
  }

  async onFile(fieldname, file, filename){
    const saveTo = `${this.downloadsFolder}/${filename}`;

    await pipeline( 
      // First step, define a file
      file, 
      //second step, filter, convert, and transform the data.
      this.handleFileBytes.apply(this, [filename]),
      // third step, where it's going to end
      fs.createWriteStream(saveTo)
    );

    logger.info(`File [${filename}] finished!`);
  }

  registerEvents(headers, onFinish){
    const busboy = new Busboy({headers});

    busboy.on("file", this.onFile.bind(this));
    busboy.on("finish", onFinish);

    return busboy;
  }
}

export default UploadHanlder;