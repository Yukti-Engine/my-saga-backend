import express from "express";
import { updateOrganizerProfile, getOrganizerDashboard, requestMatch, logOut, currentLobby, startAdventure, getAdventures, getPastAdventures, organizeEvent, retrieveRoadmap, generateAdventureName } from "../controllers/organizerController.js";
import { authOrganizer } from "../middlewares/auth.js";

const router = express.Router();
router.use(authOrganizer);

router.post("/update-profile", updateOrganizerProfile);
router.post("/dashboard", getOrganizerDashboard);
router.post("/create-lobby", requestMatch);
router.post("/logout", logOut);
router.post("/lobby", currentLobby);
router.post("/start-adventure", startAdventure);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
router.post("/organize-event", organizeEvent);
router.post("/retrieve-roadmap", retrieveRoadmap);
router.post("/generate-adventure-name", generateAdventureName);
export default router;
