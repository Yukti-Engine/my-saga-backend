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
dotenv.config();

const app = express();

app.use(cors());


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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
