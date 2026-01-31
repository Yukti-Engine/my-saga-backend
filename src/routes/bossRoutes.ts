import express from "express";
import { updateBossProfile, getBossDashboard, login, findAdventures, joinAdventure, logOut, currentMatchRequest } from "../controllers/bossController.js";

const router = express.Router();

router.post("/update-profile", updateBossProfile);
router.post("/dashboard", getBossDashboard);
router.post("/get-adventures", findAdventures);
router.post("/login", login);
router.post("/match", joinAdventure)
router.post("/logout", logOut)
router.post("/lobby", currentMatchRequest)

export default router;
