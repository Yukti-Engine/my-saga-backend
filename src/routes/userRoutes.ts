import express from "express";
import { updateUserProfile, getUserDashboard, joinAdventure, logOut, currentLobby, getAdventures, getPastAdventures, getUserQualifications } from "../controllers/userController.js";
const router = express.Router();

router.post("/update-profile", updateUserProfile);
router.post("/dashboard", getUserDashboard);
router.post("/match", joinAdventure);
router.post("/logout", logOut);
router.post("/lobby", currentLobby);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
router.post("/qualifications", getUserQualifications);
export default router;
