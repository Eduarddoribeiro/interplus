import "dotenv/config";

import http from "http";

import app from "./app.js";
import { initializeSocket } from "./socket.js";

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

initializeSocket(server);

server.listen(PORT, () => {
  console.log("🚀 Inter Club API");
  console.log(`📡 http://localhost:${PORT}`);
  console.log("🔌 Socket.IO iniciado");
});