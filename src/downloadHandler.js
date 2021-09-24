import fs from "fs";
import FileHelper from "./fileHelper.js";

class DownloadHandler{
  constructor({ downloadsFolder }){
    this.downloadsFolder = downloadsFolder;
  }

  async checkForFile(fileName){
    const filePath = `${this.downloadsFolder}/${fileName}`;
    const filesInDownloadsPath = await fs.promises.readdir(this.downloadsFolder);

    const fileExists = filesInDownloadsPath.find( file => file === fileName);

    
    if(!fileExists){
      return false;
    }
    
    const { size } = await FileHelper.getSingleFileStatus(filePath);

    return { filePath, size };
  }

  async sendWritable(filePath, res){
    fs.createReadStream(filePath).pipe(res);
  }
}

export default DownloadHandler;