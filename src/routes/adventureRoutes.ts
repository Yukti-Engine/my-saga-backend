import express from "express";
import { count, getEvent, getMessages} from "../controllers/adventureController.js";

const router = express.Router();

router.post("/count", count);
router.post("/get-messages", getMessages);
router.post("/get-event", getEvent);
export default router;
