import FileHelper from "./fileHelper.js";
import { logger } from "./logger.js";
import UploadHandler from "./uploadHandler.js";
import { resolve, dirname } from "path";
import { fileURLToPath, parse } from "url";
import { pipeline } from "stream/promises";
import DownloadHandler from "./downloadHandler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDownloadsFolder = resolve(__dirname, "..", "downloads");

export default class Routes {
  constructor(downloadsFolder = defaultDownloadsFolder){
    this.downloadsFolder = downloadsFolder;
    this.fileHelper = FileHelper;
    this.io = {};
  }

  setSocketInstance(io){
    this.io = io;
    
    return;
  }


  async defaultRoute(req, res){
    return res.end("Hello World");
  }
  
  async options(req, res){
    res.writeHead(204);
    return res.end("Hello World");
  }
  
  async post(req, res) {
    const { headers } = req;

    const { query: { socketId } } = parse(req.url, true);
    const uploadHandler = new UploadHandler({
      socketId,
      io: this.io,
      downloadsFolder: this.downloadsFolder
    });

    const onFinish = (res) => () => {
      res.writeHead(200);
      const data = JSON.stringify({ result: "Files uploaded with success! " });
      res.end(data);
    };

    const busboyInstance = uploadHandler.registerEvents(
      headers,
      onFinish(res)
    );

    await pipeline(
      req,
      busboyInstance
    );

    logger.info("Request finished with success!");
  }
  
  async get(req, res){
    const files = await this.fileHelper.getFileStatus(this.downloadsFolder);

    res.writeHead(200);
    return res.end(JSON.stringify(files));
  }

  
  handler(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");

    const method =  req => {
      const url = req.url.split("?");

      if(url[0] === "/download"){
        const downloadEndPoint = new DownloadEndPoint(this.downloadsFolder);

        return downloadEndPoint[req.method.toLowerCase()] || this.defaultRoute;
      }else {
        return this[req.method.toLowerCase()] || this.defaultRoute;
      }
    };

    return method(req).apply(this, [req, res]);
  }
}

class DownloadEndPoint{
  constructor(downloadsFolder){
    this.downloadsFolder = downloadsFolder;
  }

  async get(req, res){

    const downloadHandler = new DownloadHandler({downloadsFolder: this.downloadsFolder});
    const { query: { file } } = parse(req.url, true);
    const { filePath, size } = await downloadHandler.checkForFile(file);

    if(!filePath){
      res.writeHead(400);
      return res.end();
    }

    res.writeHead(200, "ok", {
      "Content-Disposition": `attachment; filename=${file}`,
      "content-length": size
    });

    downloadHandler.sendWritable(filePath, res);
  }
}