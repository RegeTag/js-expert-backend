import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import { logger } from "./logger.js";
import Routes from "./routes.js";


const PORT = process.env.PORT || 3000;

const localHostSSL = { // It have all https certificates
  key: fs.readFileSync("./certificates/key.pem"),
  cert: fs.readFileSync("./certificates/cert.pem")
};

const routes = new Routes();

//defines the routes
const server = https.createServer(localHostSSL, routes.handler.bind(routes));


//create a websocket server
const io = new Server(server, {
  cors:{
    origin:"*",
    credentials: false
  }
});

//Defines the socket.io sever globally on the routes
routes.setSocketInstance(io);

io.on( "connection", socket => logger.info("Connection on socketio:", socket.id));

//Start server logs
const startServer = () => {
  const { address, port } = server.address();
  logger.info(`app running at https://${address}:${port}`);
};


//start the server on port given
server.listen(PORT, startServer);