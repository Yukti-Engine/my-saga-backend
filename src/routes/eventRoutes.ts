import express from "express";
import { setAttendance } from "../controllers/eventController.js";

const router = express.Router();


router.post("/set-attendance", setAttendance);
export default router;
