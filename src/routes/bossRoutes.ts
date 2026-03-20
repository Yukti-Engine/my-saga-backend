import express from "express";
import { updateBossProfile, getBossDashboard, joinAdventure, logOut, currentLobby, getAdventures, getPastAdventures, organizeExam, getBossQualifications } from "../controllers/bossController.js";
import { authBoss } from "../middlewares/auth.js";

const router = express.Router();
router.use(authBoss);

router.post("/update-profile", updateBossProfile);
router.post("/dashboard", getBossDashboard);
router.post("/match", joinAdventure);
router.post("/logout", logOut);
router.post("/lobby", currentLobby);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
router.post("/organize-exam", organizeExam);
router.post("/qualifications", getBossQualifications);
export default router;
