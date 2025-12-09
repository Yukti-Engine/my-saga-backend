import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors"; // <-- import cors
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/shop", shopRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map