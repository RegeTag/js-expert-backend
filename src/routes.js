import FileHelper from "./fileHelper.js";
import { logger } from "./logger.js";
import UploadHandler from "./uploadHandler.js";
import { resolve, dirname } from "path";
import { fileURLToPath, parse } from "url";
import { pipeline } from "stream/promises";

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
    const method = this[req.method.toLowerCase()] || this.defaultRoute;

    return method.apply(this, [req, res]);
  }
}