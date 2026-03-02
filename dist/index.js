import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors"; // <-- import cors
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import organizerRoutes from "./routes/organizerRoutes.js";
import bossRoutes from "./routes/bossRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import adventureRoutes from "./routes/adventureRoutes.js";
import http from "http";
import { Server } from "socket.io";
import roomSocket from "./controllers/adventureController.js";
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(cors());
io.on("connection", (socket) => {
    roomSocket(io, socket);
    socket.on("disconnect", () => { });
});
app.use(bodyParser.json());
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/shop", shopRoutes);
app.use("/organizer", organizerRoutes);
app.use("/boss", bossRoutes);
app.use("/search", searchRoutes);
app.use("/adventure", adventureRoutes);
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map