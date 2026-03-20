import express from "express";
import { send, count, receive } from "../controllers/mailController.js";
import { authAny } from "../middlewares/auth.js";

const router = express.Router();
router.use(authAny);

router.post("/send", send);
router.post("/count", count);
router.post("/receive", receive);

export default router;
