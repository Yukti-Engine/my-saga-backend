/**
 * bossRoutes.ts
 *
 * Routes for authenticated Bosses (Experts).
 * All routes require a valid boss access token via authBoss.
 */
import express from "express";
import { updateBossProfile, getBossDashboard, joinAdventure, logOut, currentLobby, getAdventures, getPastAdventures, organizeExam, getBossQualifications, reportOrganizer, acceptLegal } from "../controllers/bossController.js";
import { authBoss, requireLegalAcceptance } from "../middlewares/auth.js";

const router = express.Router();
// Authenticate every request on this router
router.use(authBoss);
// accept-legal must come before requireLegalAcceptance for the same reason as user/organizer routes:
// bosses need a way to accept new legal documents before the gate blocks them
router.post("/accept-legal", acceptLegal);
// All subsequent routes require up-to-date legal acceptance
router.use(requireLegalAcceptance("boss"));

router.post("/update-profile", updateBossProfile);
router.post("/dashboard", getBossDashboard);
router.post("/match", joinAdventure);
router.post("/logout", logOut);
router.post("/lobby", currentLobby);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
router.post("/organize-exam", organizeExam);
router.post("/qualifications", getBossQualifications);
router.post("/report-organizer", reportOrganizer);
export default router;
