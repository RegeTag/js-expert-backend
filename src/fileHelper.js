import fs from "fs";
import { resolve } from "path";
import prettyBytes from "pretty-bytes";

export default class FileHelper{
  constructor(){}

  static async getFileStatus(downloadsFolder){
    const currentFiles = await fs.promises.readdir(downloadsFolder);

    const statuses = await Promise.all(
      currentFiles.map(file => fs.promises.stat(resolve(downloadsFolder, file)))
    );

    const fileStatuses = [];

    statuses.forEach( (file, index) => {
      const { birthtime, size } = file;

      fileStatuses.push({
        size: prettyBytes(size),
        file: currentFiles[index],
        owner: process.env.USER,
        lastModified: birthtime
      });
    });

    return fileStatuses;
  }
  

}