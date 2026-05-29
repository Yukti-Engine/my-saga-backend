/**
 * index.ts — Application entry point
 *
 * Bootstraps the Express app and Socket.IO server.
 * Configures CORS, per-route body-size limits, and mounts all route prefixes.
 */
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import cors from "cors";
import { adminUiHtml, cloneUiHtml } from "./adminUi.js";
import { VERSION, COMPATIBILITY_VERSION } from "./version.js";
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
import walletRoutes from "./routes/walletRoutes.js";
import { razorpayWebhook } from "./controllers/webhookController.js";
dotenv.config();

const app = express();
// Trust the first proxy so that express-rate-limit sees the real client IP
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server);

app.use(cors({ origin: '*' }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
const faviconBuf = readFileSync(path.join(publicDir, "favicon.png"));
app.get("/favicon.ico", (_req, res) => { res.type("image/png").send(faviconBuf); });
app.get("/favicon.png", (_req, res) => { res.type("image/png").send(faviconBuf); });

// Attach the adventure room socket handler for real-time chat/events
io.on("connection", (socket) => {
  roomSocket(io, socket);
  socket.on("disconnect", () => {  });
});

// Razorpay webhook — mounted before body parser so we capture the raw body for signature verification
app.post("/razorpay/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => { (req as any).rawBody = req.body.toString(); req.body = {}; next(); },
  razorpayWebhook
);

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

// Serve the admin dashboard UI as inline HTML
app.get("/admin-ui", (_req, res) => { res.type("html").send(adminUiHtml); });
app.get("/clone-db", (_req, res) => { res.type("html").send(cloneUiHtml); });

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
app.use("/wallet", walletRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
app.get('/', (req, res) => {
  res.status(200).json({ name: 'my-saga-api', version: VERSION, compatibilityVersion: COMPATIBILITY_VERSION });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on PORT=${PORT}`);
});
