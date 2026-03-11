import express from "express";
import { getOffers } from "../controllers/shopController.js";
const router = express.Router();
router.post("/offers", getOffers);
export default router;
//# sourceMappingURL=shopRoutes.js.map