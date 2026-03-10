import express from "express";
import { updateOrganizerProfile, getOrganizerDashboard, requestMatch, login, logOut, currentLobby, startAdventure, getAdventures, getPastAdventures, organizeEvent, send, count, receive } from "../controllers/organizerController.js";

const router = express.Router();

router.post("/update-profile", updateOrganizerProfile);
router.post("/dashboard", getOrganizerDashboard);
router.post("/request-match", requestMatch);
router.post("/login", login);
router.post("/logout", logOut);
router.post("/lobby", currentLobby);
router.post("/startAdventure", startAdventure);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
router.post("/organize-event", organizeEvent);

router.post("/send", send);
router.post("/count", count);
router.post("/receive", receive);

export default router;
