import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors"; // <-- import cors
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import organizerRoutes from "./routes/organizerRoutes.js"
import bossRoutes from "./routes/bossRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import adventureRoutes from "./routes/adventureRoutes.js"
import http from "http";
import { Server } from "socket.io";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(cors());
io.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("message", "A user has joined!");
  });
  socket.on("send_message", ({ room, message }) => {
    io.to(room).emit("message", message);
  });
  socket.on("leave_room", (roomName) => {
    socket.leave(roomName);
    socket.to(roomName).emit("message", "A user has left!");
  });
  socket.on("disconnect", () => {  });
});
app.use(bodyParser.json());
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/shop", shopRoutes);
app.use("/organizer", organizerRoutes);
app.use("/boss", bossRoutes);
app.use("/domains", categoryRoutes);
app.use("/notifications", notificationRoutes);
app.use("/adventure", adventureRoutes);
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
