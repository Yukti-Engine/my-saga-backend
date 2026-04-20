import express from "express";
import { updateUserProfile, getUserDashboard, joinAdventure, logOut, currentLobby, getAdventures, getPastAdventures, getUserQualifications, reportOrganizer } from "../controllers/userController.js";
import { authUser } from "../middlewares/auth.js";

const router = express.Router();
router.use(authUser);

router.post("/update-profile", updateUserProfile);
router.post("/dashboard", getUserDashboard);
router.post("/match", joinAdventure);
router.post("/logout", logOut);
router.post("/lobby", currentLobby);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
router.post("/qualifications", getUserQualifications);
router.post("/report-organizer", reportOrganizer);
export default router;
