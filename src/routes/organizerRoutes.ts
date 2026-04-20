import express from "express";
import rateLimit from "express-rate-limit";
import { updateOrganizerProfile, getOrganizerDashboard, requestMatch, logOut, currentLobby, startAdventure, getAdventures, getPastAdventures, organizeEvent, retrieveRoadmap, generateAdventureName, getOrganizerQualifications, getLimitation } from "../controllers/organizerController.js";
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
router.post("/get-qualifications", getOrganizerQualifications);
router.post("/limitation", getLimitation);

const generateNameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/generate-adventure-name", generateNameLimiter, generateAdventureName);
export default router;
