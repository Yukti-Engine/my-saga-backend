import express from "express";
import { setAttendance } from "../controllers/eventController.js";
import { authOrganizer } from "../middlewares/auth.js";

const router = express.Router();

router.post("/set-attendance", authOrganizer, setAttendance);
export default router;
