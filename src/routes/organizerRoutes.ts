/**
 * organizerRoutes.ts
 *
 * Routes for authenticated Organizers (Guides).
 * All routes require a valid organizer access token via authOrganizer.
 */
import express from "express";
import rateLimit from "express-rate-limit";
import { updateOrganizerProfile, getOrganizerDashboard, requestMatch, logOut, currentLobby, startAdventure, getAdventures, getPastAdventures, organizeEvent, retrieveRoadmap, generateAdventureName, getOrganizerQualifications, getLimitation, reportUser, reportBoss, dismissLobby, acceptLegal, requestSchedule, getVenueSchedules, getVenues } from "../controllers/organizerController.js";
import { authOrganizer, requireLegalAcceptance } from "../middlewares/auth.js";

const router = express.Router();
// Authenticate every request on this router
router.use(authOrganizer);
// accept-legal is registered BEFORE requireLegalAcceptance so organizers can accept updated
// legal documents without being blocked by the very gate they are trying to clear
router.post("/accept-legal", acceptLegal);
// All subsequent routes require up-to-date legal acceptance
router.use(requireLegalAcceptance("organizer"));

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
router.post("/report-user", reportUser);
router.post("/report-boss", reportBoss);
router.post("/dismiss-lobby", dismissLobby);
router.post("/venues", getVenues);
router.post("/venue-schedules", getVenueSchedules);
router.post("/request-schedule", requestSchedule);

// Extra rate limit for LLM-backed name generation to control API costs
const generateNameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/generate-adventure-name", generateNameLimiter, generateAdventureName);
export default router;
