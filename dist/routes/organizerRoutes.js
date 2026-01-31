import express from "express";
import { updateOrganizerProfile, getOrganizerDashboard, requestMatch, login, logOut, currentMatchRequest } from "../controllers/organizerController.js";
const router = express.Router();
router.post("/update-profile", updateOrganizerProfile);
router.post("/dashboard", getOrganizerDashboard);
router.post("/request-match", requestMatch);
router.post("/login", login);
router.post("/logout", logOut);
router.post("/lobby", currentMatchRequest);
export default router;
//# sourceMappingURL=organizerRoutes.js.map