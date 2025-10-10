import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors"; // <-- import cors
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authOrgBossRoutes from "./routes/authOrgBossRoutes.js";
dotenv.config();
const app = express();
// Enable CORS for all routes
app.use(cors());
// Or enable CORS for specific origins:
// app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/ob", authOrgBossRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map