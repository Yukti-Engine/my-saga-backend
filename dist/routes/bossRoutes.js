import express from "express";
import { updateBossProfile, getBossDashboard, login } from "../controllers/bossController.js";
const router = express.Router();
router.post("/update-profile", updateBossProfile);
router.post("/dashboard", getBossDashboard);
router.post("/login", login);
export default router;
//# sourceMappingURL=bossRoutes.js.map