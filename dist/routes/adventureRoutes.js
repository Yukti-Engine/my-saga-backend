import express from "express";
import { count, getMessages } from "../controllers/adventureController.js";
const router = express.Router();
router.post("/count", count);
router.post("/get-messages", getMessages);
export default router;
//# sourceMappingURL=adventureRoutes.js.map