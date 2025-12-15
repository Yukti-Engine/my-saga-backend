import express from "express";
import { updateBossProfile, getBossDashboard, requestMatch, login } from "../controllers/bossController.js";
const router = express.Router();
router.post("/update-profile", updateBossProfile);
router.post("/dashboard", getBossDashboard);
router.post("/request-match", requestMatch);
router.post("/login", login);
export default router;
//# sourceMappingURL=bossRoutes.js.map