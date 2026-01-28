import express from "express";
import { updateBossProfile, getBossDashboard, login, findAdventures } from "../controllers/bossController.js";

const router = express.Router();

router.post("/update-profile", updateBossProfile);
router.post("/dashboard", getBossDashboard);
router.post("/get-adventures", findAdventures);
router.post("/login", login);

export default router;
