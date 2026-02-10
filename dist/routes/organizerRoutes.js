import express from "express";
import { updateOrganizerProfile, getOrganizerDashboard, requestMatch, login, logOut, currentMatchRequest, startAdventure, getAdventures, getPastAdventures } from "../controllers/organizerController.js";
const router = express.Router();
router.post("/update-profile", updateOrganizerProfile);
router.post("/dashboard", getOrganizerDashboard);
router.post("/request-match", requestMatch);
router.post("/login", login);
router.post("/logout", logOut);
router.post("/lobby", currentMatchRequest);
router.post("/startAdventure", startAdventure);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
export default router;
//# sourceMappingURL=organizerRoutes.js.map