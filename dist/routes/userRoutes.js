import express from "express";
import { updateUserProfile, getUserDashboard, requestMatch, joinAdventure, logOut, currentLobby, getAdventures, getPastAdventures, approveAdventureEvent } from "../controllers/userController.js";
const router = express.Router();
router.post("/update-profile", updateUserProfile);
router.post("/dashboard", getUserDashboard);
router.post("/find-adventures", requestMatch);
router.post("/match", joinAdventure);
router.post("/logout", logOut);
router.post("/lobby", currentLobby);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
router.post("/approve-event", approveAdventureEvent);
export default router;
//# sourceMappingURL=userRoutes.js.map