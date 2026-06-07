import express from "express";
import { summarizeEvent, markChallenge } from "../controllers/eventController.js";
import { authOrganizer, authBoss } from "../middlewares/auth.js";

const router = express.Router();

router.post("/summarize", authOrganizer, summarizeEvent);
router.post("/mark-challenge", authBoss, markChallenge);
export default router;
