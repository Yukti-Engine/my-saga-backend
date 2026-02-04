import express from "express";
import { send, count, receive} from "../controllers/privateMessageController.js";

const router = express.Router();

router.post("/send", send);
router.post("/count", count);
router.post("/receive", receive);

export default router;
