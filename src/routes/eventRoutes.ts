import express from "express";
import { summarizeEvent } from "../controllers/eventController.js";
import { authOrganizer } from "../middlewares/auth.js";

const router = express.Router();

router.post("/summarize", authOrganizer, summarizeEvent);
export default router;
