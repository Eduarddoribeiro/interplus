import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3001";

export const socket = io(API_URL);

socket.on("connect", () => {
  console.log("🟢 Socket conectado:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 Socket desconectado");
});

socket.onAny((event, ...args) => {
  console.log("📨 Evento Socket:", event, args);
});