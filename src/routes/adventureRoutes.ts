import express from "express";
import { count, getMessages} from "../controllers/adventureController";

const router = express.Router();

router.post("/count", count);
router.post("/get-messages", getMessages);

export default router;
