import FileHelper from "./fileHelper.js";
import { logger } from "./logger.js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class Routes {
  constructor(){
    this.downloadsFolder = resolve(__dirname, "..", "downloads");
    this.fileHelper = FileHelper;
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
  
  async post(req, res){
    logger.info("Post");
    return res.end("Hello World");
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