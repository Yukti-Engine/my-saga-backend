import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors"; // <-- import cors
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import mailRoutes from "./routes/mailRoutes.js";
import organizerRoutes from "./routes/organizerRoutes.js"
import bossRoutes from "./routes/bossRoutes.js"
import searchRoutes from "./routes/searchRoutes.js"
import adventureRoutes from "./routes/adventureRoutes.js"
import http from "http";
import { Server } from "socket.io";
import roomSocket from "./controllers/adventureController.js";
import eventRoutes from "./routes/eventRoutes.js";
import moderatorRoutes from "./routes/moderatorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(cors(
  process.env.NODE_ENV === 'production'
    ? { origin: ['https://mysaga.in', 'https://www.mysaga.in', 'https://guide.mysaga.in', 'https://myguild.in', 'https://www.myguild.in'], credentials: true }
    : { origin: '*' }
));
io.on("connection", (socket) => {
  roomSocket(io, socket);
  socket.on("disconnect", () => {  });
});
app.use(bodyParser.json());
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/mail", mailRoutes);
app.use("/organizer", organizerRoutes);
app.use("/boss", bossRoutes);
app.use("/search", searchRoutes);
app.use("/adventure", adventureRoutes);
app.use("/event", eventRoutes);
app.use("/moderator", moderatorRoutes);
app.use("/admin", adminRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
app.get('/min-frontend-version', (req, res) => {
  res.status(200).json({ minVersion: '1.0.0' });
});
app.get('/', (req, res) => {
  res.status(200).json({ name: 'my-saga-api', version: '1.0.0' });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
