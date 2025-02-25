import { Server } from "socket.io";
import http from "http";
import express from "express";
// import Message from "../models/message.model.js";
// import Conversation from "../models/group.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

   // Listen for client telling us they want to "join" a group room
   socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group: ${groupId}`);
  });

  // Listen for leaving the group room
  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`Socket ${socket.id} left group: ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
