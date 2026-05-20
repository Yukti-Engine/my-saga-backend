/**
 * index.ts — Application entry point
 *
 * Bootstraps the Express app and Socket.IO server.
 * Configures CORS (restricted to known origins in production),
 * per-route body-size limits, and mounts all route prefixes.
 */
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
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
import obRoutes from "./routes/obRoutes.js";
dotenv.config();

const app = express();
// Trust the first proxy so that express-rate-limit sees the real client IP
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server);

// Production CORS: restrict to known MySaga front-end origins
app.use(cors(
  process.env.NODE_ENV === 'production'
    ? { origin: ['https://mysaga.in', 'https://www.mysaga.in', 'https://guide.mysaga.in', 'https://mod.mysaga.in', 'https://myguild.in', 'https://www.myguild.in'], credentials: true }
    : { origin: '*' }
));

// Attach the adventure room socket handler for real-time chat/events
io.on("connection", (socket) => {
  roomSocket(io, socket);
  socket.on("disconnect", () => {  });
});

// Apply larger body-size limits only for routes that accept base64-encoded images
app.use((req, res, next) => {
  const url = req.url;
  if (url.includes("/upload-theme-icon")) {
    return bodyParser.json({ limit: "5mb" })(req, res, next);
  }
  if (
    url.includes("/upload-badge-icon") ||
    url.includes("/upload-category-icon") ||
    url.includes("/update-profile") ||
    url.includes("/create-badge")
  ) {
    return bodyParser.json({ limit: "1mb" })(req, res, next);
  }
  return bodyParser.json({ limit: "100kb" })(req, res, next);
});

// Serve the admin dashboard UI (resolve from dist/ back to src/ since tsc doesn't copy HTML)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminUiPath = path.join(__dirname, "..", "src", "admin-ui");
app.use("/admin-ui", express.static(adminUiPath));
app.get("/admin-ui", (_req, res) => res.sendFile(path.join(adminUiPath, "index.html")));

// Route mounting — each prefix maps to its dedicated router
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
app.use("/ob", obRoutes);
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
