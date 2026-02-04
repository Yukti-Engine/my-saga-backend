import express from "express";
import { updateOrganizerProfile, getOrganizerDashboard, requestMatch, login, logOut, currentMatchRequest, startAdventure } from "../controllers/organizerController.js";
const router = express.Router();
router.post("/update-profile", updateOrganizerProfile);
router.post("/dashboard", getOrganizerDashboard);
router.post("/request-match", requestMatch);
router.post("/login", login);
router.post("/logout", logOut);
router.post("/lobby", currentMatchRequest);
router.post("/startAdventure", startAdventure);
export default router;
//# sourceMappingURL=organizerRoutes.js.map