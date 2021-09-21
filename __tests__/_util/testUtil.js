import { Readable, Transform, Writable } from "stream";
import { jest } from "@jest/globals";

class TestUtil{

  static mockDateNow(mockImplementationPeriods){
    const now = jest.spyOn(global.Date, global.Date.now.name);

    mockImplementationPeriods.forEach( time => {
      now.mockReturnValueOnce(time);
    });
  }

  static getTimeFromDate(dateString){
    return new Date(dateString).getTime();
  }

  static generateReadableStream(dataArray){
    return new Readable({
      objectMode: true,
      async read(){
        dataArray.forEach(data => {
          this.push(data);
        });

        this.push(null);
      }
    });
  }

  static generateWritableStream(onData){
    return new Writable({
      objectMode: true,
      write( chunk, encoding, callback ){
        onData(chunk);

        callback(null, chunk);
      }
    });
  }

  static generateTransformStream(onData){
    return new Transform({
      objectMode:true,
      transform(chunk, encoding, callback){
        onData(chunk),

        callback(null, chunk);
      }
    });
  }
}

export default TestUtil;